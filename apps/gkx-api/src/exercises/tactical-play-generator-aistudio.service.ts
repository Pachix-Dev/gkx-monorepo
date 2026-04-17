import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { ExerciseEntity } from './exercise.entity';
import type { GeneratePlayDto } from './dto/generate-play.dto';
import type { GeneratePlayResponseDto } from './dto/generate-play-response.dto';
import {
  CATALOG_ASSETS,
  CATALOG_BACKGROUNDS,
  CATALOG_ASSET_BY_ID,
  CATALOG_BACKGROUND_BY_ID,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_MARGIN,
  MAX_ELEMENTS_PER_PLAY,
} from './tactical-asset-catalog';

const GOOGLE_AISTUDIO_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';
const GOOGLE_AISTUDIO_MODEL =
  process.env.GOOGLE_AISTUDIO_MODEL?.trim() || 'gemini-2.0-flash';
const GOOGLE_AISTUDIO_FALLBACK_MODELS = (
  process.env.GOOGLE_AISTUDIO_FALLBACK_MODELS ??
  ['gemini-2.0-flash-lite', 'gemini-1.5-flash'].join(',')
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

type RawAIPlay = {
  backgroundId?: string | null;
  elements?: unknown[];
  summary?: string;
  warnings?: string[];
};

type RawElement = Record<string, unknown>;

type GoogleAiStudioGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const VALID_PATTERNS = ['solid', 'dashed', 'dotted', 'discontinuous'] as const;
const VALID_HEADS = ['none', 'triangle', 'circle', 'square', 'bar'] as const;

@Injectable()
export class TacticalPlayGeneratorAiStudioService {
  private readonly logger = new Logger(TacticalPlayGeneratorAiStudioService.name);

  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exercisesRepository: Repository<ExerciseEntity>,
  ) {}

  async generatePlay(
    exerciseId: string,
    dto: GeneratePlayDto,
    actor: AuthenticatedUser,
  ): Promise<GeneratePlayResponseDto> {
    const apiKey = process.env.GOOGLE_AISTUDIO_API_KEY?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_AISTUDIO_API_KEY no esta configurado en el servidor',
      );
    }

    const exercise = await this.exercisesRepository.findOne({
      where: { id: exerciseId },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    if (
      actor.role !== Role.SUPER_ADMIN &&
      exercise.tenantId !== actor.tenantId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(
      dto,
      exercise.name,
      exercise.objective,
    );

    this.logger.debug(
      `Generating play (Google AI Studio) for exercise "${exercise.name}" (${exerciseId})`,
    );

    const rawText = await this.callGoogleAiStudio(apiKey, systemPrompt, userPrompt);
    return this.parseAndNormalize(rawText, dto.backgroundId);
  }

  private buildSystemPrompt(): string {
    const assetList = CATALOG_ASSETS.map(
      (a) =>
        `  - "${a.assetId}" -> ${a.aiDescription} (tamano: ${a.defaultWidth}x${a.defaultHeight}px)`,
    ).join('\n');

    const backgroundList = CATALOG_BACKGROUNDS.map(
      (b) => `  - "${b.backgroundId}" -> ${b.aiDescription}`,
    ).join('\n');

    return `Eres GKX Play Generator, asistente experto en diseno de ejercicios tacticos para porteros de futbol.

CANVAS:
- Dimensiones: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} px.
- Margen de seguridad: ${CANVAS_MARGIN}px. Toda coordenada x debe estar en [${CANVAS_MARGIN}, ${CANVAS_WIDTH - CANVAS_MARGIN}] e y en [${CANVAS_MARGIN}, ${CANVAS_HEIGHT - CANVAS_MARGIN}].
- Maximo ${MAX_ELEMENTS_PER_PLAY} elementos en total.
- Origen (0,0) esta en la esquina superior izquierda.
- El area de porteria suele estar centrada en x~650, y~540 (vista frontal) o y~100 (vista superior).

FONDOS DISPONIBLES (usa solo estos backgroundId):
${backgroundList}

ASSETS DISPONIBLES (usa solo estos assetId - cualquier otro se descartara):
${assetList}

TIPOS DE ELEMENTOS QUE PUEDES GENERAR:

1. asset - Coloca un elemento del catalogo en el canvas:
   { "kind": "asset", "assetId": "<id>", "x": <number>, "y": <number>, "rotation": <degrees, default 0> }

2. arrow - Trayectoria de movimiento con punta de flecha:
   { "kind": "arrow", "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number>,
     "midX": <number, optional curva>, "midY": <number, optional curva>,
     "stroke": "<hex color>", "strokeWidth": <1-12, default 4>,
     "pattern": "solid"|"dashed"|"discontinuous",
     "startHead": "none"|"triangle"|"circle"|"bar",
     "endHead": "none"|"triangle"|"circle"|"bar" }

3. line - Linea de pase o referencia sin cabeza de flecha:
   { "kind": "line", "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number>,
     "midX": <optional>, "midY": <optional>,
     "stroke": "<hex>", "strokeWidth": <1-12>, "pattern": "solid"|"dashed"|"discontinuous" }

4. text - Etiqueta tactica visible en el canvas:
   { "kind": "text", "text": "<max 80 chars>", "x": <number>, "y": <number>,
     "fontSize": <14-48, default 22>, "fill": "<hex, default #ffffff>" }

5. rect - Zona delimitada (area de trabajo, zona de finalizacion, etc.):
   { "kind": "rect", "x": <number>, "y": <number>, "width": <number>, "height": <number>,
     "stroke": "<hex>", "strokeWidth": <1-8>, "fill": "<hex con opacidad>",
     "opacity": <0.1-1.0>, "cornerRadius": <0-40> }

CONVENCIONES DE COLOR:
- Movimiento del portero: "#2563eb" (azul)
- Trayectoria del balon: "#ef4444" (rojo)
- Zonas de trabajo: "#22c55e" (verde)
- Etiquetas y fases: "#facc15" (amarillo) o "#ffffff" (blanco)
- Oponentes/obstaculos: "#f97316" (naranja)

INSTRUCCIONES DE RESPUESTA:
- Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin bloques de codigo, sin texto adicional.
- El JSON debe ser parseable directamente con JSON.parse().
- El campo "elements" debe tener al menos 1 elemento y como maximo ${MAX_ELEMENTS_PER_PLAY}.
- El campo "summary" es obligatorio, en espanol, 2-4 oraciones describiendo la jugada tecnicamente.
- El campo "warnings" es obligatorio (puede ser []).
- Si solicitan un asset que no esta en el catalogo, usa el mas cercano disponible y anade una advertencia.

ESQUEMA EXACTO DE RESPUESTA:
{
  "backgroundId": "<backgroundId del catalogo, o null si el entrenador no especifico>",
  "elements": [ ...elementos ],
  "summary": "<descripcion tecnica en espanol>",
  "warnings": [ "<advertencia si aplica>" ]
}`;
  }

  private buildUserPrompt(
    dto: GeneratePlayDto,
    exerciseName: string,
    objective: string | null,
  ): string {
    const lines: string[] = [
      `Ejercicio: "${exerciseName}"`,
      `Descripcion del entrenador: ${dto.prompt}`,
    ];

    if (objective) lines.push(`Objetivo tecnico del ejercicio: ${objective}`);
    if (dto.category) lines.push(`Categoria: ${dto.category}`);
    if (dto.goalkeepersCount)
      lines.push(`Numero de porteros en el ejercicio: ${dto.goalkeepersCount}`);
    if (dto.backgroundId)
      lines.push(`Fondo preferido por el entrenador: "${dto.backgroundId}"`);

    lines.push(
      'Genera la jugada tactica completa. Posiciona los elementos para que sean visualmente claros, bien espaciados y pedagogicamente correctos para un entrenador de porteros.',
    );

    return lines.join('\n');
  }

  private async callGoogleAiStudio(
    apiKey: string,
    system: string,
    user: string,
  ): Promise<string> {
    const modelsToTry = this.resolveModelCandidates();
    let lastHttpError: { status: number; body: string } | null = null;

    for (let i = 0; i < modelsToTry.length; i += 1) {
      const model = modelsToTry[i];
      const isLastModel = i === modelsToTry.length - 1;
      const endpoint = `${GOOGLE_AISTUDIO_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: system }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: user }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
        });
      } catch (error) {
        this.logger.error('Google AI Studio network error', error);
        throw new InternalServerErrorException(
          'No se pudo conectar con Google AI Studio. Verifica la conexion.',
        );
      }

      if (response.ok) {
        if (i > 0) {
          this.logger.warn(
            `Google AI Studio fallback activado. Modelo exitoso: ${model}`,
          );
        }

        const payload = (await response.json()) as GoogleAiStudioGenerateResponse;
        const content = payload.candidates?.[0]?.content?.parts?.find(
          (part) => typeof part.text === 'string' && part.text.trim().length > 0,
        )?.text;

        if (!content) {
          throw new InternalServerErrorException(
            'Google AI Studio no devolvio contenido. Intenta de nuevo.',
          );
        }

        return content;
      }

      const body = await response.text().catch(() => '');
      lastHttpError = { status: response.status, body };

      if (!isLastModel && this.shouldRetryWithFallback(response.status, body)) {
        this.logger.warn(
          `Google AI Studio rechazo el modelo ${model} (${response.status}). Probando fallback...`,
        );
        continue;
      }

      this.logger.error(`Google AI Studio HTTP ${response.status}: ${body}`);
      throw new InternalServerErrorException(
        `Google AI Studio devolvio un error (${response.status}). Intenta de nuevo.`,
      );
    }

    if (lastHttpError) {
      this.logger.error(
        `Google AI Studio HTTP ${lastHttpError.status}: ${lastHttpError.body}`,
      );
    }

    throw new InternalServerErrorException(
      'No se encontro un modelo disponible en Google AI Studio. Intenta mas tarde o configura GOOGLE_AISTUDIO_MODEL.',
    );
  }

  private resolveModelCandidates(): string[] {
    const unique = Array.from(
      new Set([GOOGLE_AISTUDIO_MODEL, ...GOOGLE_AISTUDIO_FALLBACK_MODELS]),
    );

    if (unique.length > 0) return unique;
    return ['gemini-2.0-flash'];
  }

  private shouldRetryWithFallback(status: number, body: string): boolean {
    if (status === 404 || status === 408 || status === 429 || status >= 500) {
      return true;
    }

    const normalized = body.toLowerCase();
    return (
      normalized.includes('model') &&
        (normalized.includes('not found') ||
          normalized.includes('not supported') ||
          normalized.includes('is not available')) ||
      normalized.includes('quota exceeded')
    );
  }

  private parseAndNormalize(
    rawText: string,
    requestedBackgroundId: string | undefined,
  ): GeneratePlayResponseDto {
    const warnings: string[] = [];

    let parsed: RawAIPlay;
    const rawJson = this.unwrapMarkdownJson(rawText);
    try {
      parsed = JSON.parse(rawJson) as RawAIPlay;
    } catch {
      throw new InternalServerErrorException(
        'La IA devolvio JSON malformado. Intenta de nuevo.',
      );
    }

    if (Array.isArray(parsed.warnings)) {
      warnings.push(
        ...parsed.warnings.filter((w): w is string => typeof w === 'string'),
      );
    }

    const bgId = requestedBackgroundId ?? parsed.backgroundId ?? null;
    const resolvedBg = bgId ? CATALOG_BACKGROUND_BY_ID.get(bgId) : undefined;
    if (bgId && !resolvedBg) {
      warnings.push(
        `Fondo "${bgId}" no encontrado en el catalogo; el editor usara el fondo actual.`,
      );
    }

    const rawElements = Array.isArray(parsed.elements)
      ? parsed.elements.slice(0, MAX_ELEMENTS_PER_PLAY)
      : [];

    const elements: Record<string, unknown>[] = [];
    for (const raw of rawElements) {
      const el = this.normalizeElement(raw as RawElement, warnings);
      if (el) elements.push(el);
    }

    if (elements.length === 0) {
      warnings.push(
        'La IA no genero elementos validos. Intenta con un prompt mas especifico.',
      );
    }

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Jugada generada automaticamente.';

    return {
      backgroundId: resolvedBg?.backgroundId ?? null,
      backgroundSrc: resolvedBg?.src ?? null,
      elements,
      summary,
      warnings,
    };
  }

  private unwrapMarkdownJson(rawText: string): string {
    const trimmed = rawText.trim();
    if (!trimmed.startsWith('```')) return trimmed;

    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  private normalizeElement(
    el: RawElement,
    warnings: string[],
  ): Record<string, unknown> | null {
    const kind = typeof el.kind === 'string' ? el.kind : '';
    const id = `ai-${Math.random().toString(36).slice(2, 10)}`;

    const base = {
      id,
      rotation: typeof el.rotation === 'number' ? el.rotation % 360 : 0,
      scaleX: 1,
      scaleY: 1,
      visible: true,
      locked: false,
    };

    const xMin = CANVAS_MARGIN;
    const xMax = CANVAS_WIDTH - CANVAS_MARGIN;
    const yMin = CANVAS_MARGIN;
    const yMax = CANVAS_HEIGHT - CANVAS_MARGIN;

    const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
      const n = typeof v === 'number' && isFinite(v) ? v : fallback;
      return Math.max(lo, Math.min(hi, n));
    };

    if (kind === 'asset') {
      const assetId = typeof el.assetId === 'string' ? el.assetId : '';
      const catalogEntry = CATALOG_ASSET_BY_ID.get(assetId);
      if (!catalogEntry) {
        warnings.push(
          `Asset "${assetId}" no esta en el catalogo y fue descartado.`,
        );
        return null;
      }
      return {
        ...base,
        kind: 'asset',
        x: clamp(
          el.x,
          xMin,
          xMax - catalogEntry.defaultWidth,
          CANVAS_WIDTH / 2,
        ),
        y: clamp(
          el.y,
          yMin,
          yMax - catalogEntry.defaultHeight,
          CANVAS_HEIGHT / 2,
        ),
        src: catalogEntry.src,
        width: catalogEntry.defaultWidth,
        height: catalogEntry.defaultHeight,
        label: catalogEntry.label,
      };
    }

    if (kind === 'arrow' || kind === 'line') {
      const x1 = clamp(el.x1, xMin, xMax, CANVAS_WIDTH * 0.3);
      const y1 = clamp(el.y1, yMin, yMax, CANVAS_HEIGHT * 0.5);
      const x2 = clamp(el.x2, xMin, xMax, CANVAS_WIDTH * 0.7);
      const y2 = clamp(el.y2, yMin, yMax, CANVAS_HEIGHT * 0.5);
      const midX = clamp(el.midX, xMin, xMax, (x1 + x2) / 2);
      const midY = clamp(el.midY, yMin, yMax, (y1 + y2) / 2);

      const pattern = VALID_PATTERNS.includes(
        el.pattern as (typeof VALID_PATTERNS)[number],
      )
        ? (el.pattern as string)
        : 'solid';

      const startHead = VALID_HEADS.includes(
        el.startHead as (typeof VALID_HEADS)[number],
      )
        ? (el.startHead as string)
        : 'none';

      const endHead = VALID_HEADS.includes(
        el.endHead as (typeof VALID_HEADS)[number],
      )
        ? (el.endHead as string)
        : kind === 'arrow'
          ? 'triangle'
          : 'none';

      return {
        ...base,
        kind,
        x: 0,
        y: 0,
        points: [x1, y1, midX, midY, x2, y2],
        stroke: typeof el.stroke === 'string' ? el.stroke : '#2563eb',
        strokeWidth: clamp(el.strokeWidth, 1, 12, 4),
        pattern,
        startHead,
        endHead,
        curveStrength: 1,
      };
    }

    if (kind === 'text') {
      const text =
        typeof el.text === 'string' ? el.text.trim().slice(0, 80) : 'Fase';
      if (!text) return null;
      return {
        ...base,
        kind: 'text',
        x: clamp(el.x, xMin, xMax - 160, CANVAS_WIDTH / 2 - 80),
        y: clamp(el.y, yMin, yMax - 30, 40),
        text,
        width: 240,
        fontSize: clamp(el.fontSize, 14, 48, 22),
        fontFamily: 'Arial',
        fill: typeof el.fill === 'string' ? el.fill : '#ffffff',
      };
    }

    if (kind === 'rect') {
      const x = clamp(el.x, xMin, xMax - 40, CANVAS_WIDTH * 0.25);
      const y = clamp(el.y, yMin, yMax - 40, CANVAS_HEIGHT * 0.25);
      return {
        ...base,
        kind: 'rect',
        x,
        y,
        width: clamp(el.width, 40, xMax - x, 180),
        height: clamp(el.height, 40, yMax - y, 100),
        stroke: typeof el.stroke === 'string' ? el.stroke : '#22c55e',
        strokeWidth: clamp(el.strokeWidth, 1, 8, 3),
        fill: typeof el.fill === 'string' ? el.fill : 'rgba(34,197,94,0.15)',
        dash: [10, 6],
        opacity: clamp(el.opacity, 0.1, 1.0, 0.9),
        cornerRadius: clamp(el.cornerRadius, 0, 40, 8),
      };
    }

    warnings.push(
      `Tipo de elemento "${kind}" no esta soportado y fue descartado.`,
    );
    return null;
  }
}
