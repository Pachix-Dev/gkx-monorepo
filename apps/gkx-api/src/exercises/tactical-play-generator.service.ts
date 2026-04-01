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

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
// gpt-4o-mini: balance costo/calidad óptimo para generación estructurada
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// ─── Tipos internos del parser ────────────────────────────────────────────────

type RawAIPlay = {
  backgroundId?: string | null;
  elements?: unknown[];
  summary?: string;
  warnings?: string[];
};

type RawElement = Record<string, unknown>;

const VALID_PATTERNS = ['solid', 'dashed', 'dotted', 'discontinuous'] as const;
const VALID_HEADS = ['none', 'triangle', 'circle', 'square', 'bar'] as const;

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable()
export class TacticalPlayGeneratorService {
  private readonly logger = new Logger(TacticalPlayGeneratorService.name);

  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exercisesRepository: Repository<ExerciseEntity>,
  ) {}

  // ─── Punto de entrada público ───────────────────────────────────────────────

  async generatePlay(
    exerciseId: string,
    dto: GeneratePlayDto,
    actor: AuthenticatedUser,
  ): Promise<GeneratePlayResponseDto> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY no está configurado en el servidor',
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
      `Generating play for exercise "${exercise.name}" (${exerciseId})`,
    );

    const rawText = await this.callOpenAI(apiKey, systemPrompt, userPrompt);
    return this.parseAndNormalize(rawText, dto.backgroundId);
  }

  // ─── System prompt ──────────────────────────────────────────────────────────
  // Enviado una vez por request; define el contrato de output que la IA debe cumplir.

  private buildSystemPrompt(): string {
    const assetList = CATALOG_ASSETS.map(
      (a) =>
        `  - "${a.assetId}" → ${a.aiDescription} (tamaño: ${a.defaultWidth}×${a.defaultHeight}px)`,
    ).join('\n');

    const backgroundList = CATALOG_BACKGROUNDS.map(
      (b) => `  - "${b.backgroundId}" → ${b.aiDescription}`,
    ).join('\n');

    return `Eres GKX Play Generator, asistente experto en diseño de ejercicios tácticos para porteros de fútbol.

CANVAS:
- Dimensiones: ${CANVAS_WIDTH}×${CANVAS_HEIGHT} px.
- Margen de seguridad: ${CANVAS_MARGIN}px. Toda coordenada x debe estar en [${CANVAS_MARGIN}, ${CANVAS_WIDTH - CANVAS_MARGIN}] e y en [${CANVAS_MARGIN}, ${CANVAS_HEIGHT - CANVAS_MARGIN}].
- Máximo ${MAX_ELEMENTS_PER_PLAY} elementos en total.
- Origen (0,0) está en la esquina superior izquierda.
- El área de portería suele estar centrada en x≈650, y≈540 (vista frontal) o y≈100 (vista superior).

FONDOS DISPONIBLES (usa solo estos backgroundId):
${backgroundList}

ASSETS DISPONIBLES (usa solo estos assetId — cualquier otro se descartará):
${assetList}

TIPOS DE ELEMENTOS QUE PUEDES GENERAR:

1. asset — Coloca un elemento del catálogo en el canvas:
   { "kind": "asset", "assetId": "<id>", "x": <number>, "y": <number>, "rotation": <degrees, default 0> }

2. arrow — Trayectoria de movimiento con punta de flecha:
   { "kind": "arrow", "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number>,
     "midX": <number, optional curva>, "midY": <number, optional curva>,
     "stroke": "<hex color>", "strokeWidth": <1-12, default 4>,
     "pattern": "solid"|"dashed"|"discontinuous",
     "startHead": "none"|"triangle"|"circle"|"bar",
     "endHead": "none"|"triangle"|"circle"|"bar" }

3. line — Línea de pase o referencia sin cabeza de flecha:
   { "kind": "line", "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number>,
     "midX": <optional>, "midY": <optional>,
     "stroke": "<hex>", "strokeWidth": <1-12>, "pattern": "solid"|"dashed"|"discontinuous" }

4. text — Etiqueta táctica visible en el canvas:
   { "kind": "text", "text": "<max 80 chars>", "x": <number>, "y": <number>,
     "fontSize": <14-48, default 22>, "fill": "<hex, default #ffffff>" }

5. rect — Zona delimitada (área de trabajo, zona de finalización, etc.):
   { "kind": "rect", "x": <number>, "y": <number>, "width": <number>, "height": <number>,
     "stroke": "<hex>", "strokeWidth": <1-8>, "fill": "<hex con opacidad>",
     "opacity": <0.1-1.0>, "cornerRadius": <0-40> }

CONVENCIONES DE COLOR:
- Movimiento del portero: "#2563eb" (azul)
- Trayectoria del balón: "#ef4444" (rojo)
- Zonas de trabajo: "#22c55e" (verde)
- Etiquetas y fases: "#facc15" (amarillo) o "#ffffff" (blanco)
- Oponentes/obstáculos: "#f97316" (naranja)

INSTRUCCIONES DE RESPUESTA:
- Responde ÚNICAMENTE con un objeto JSON válido. Sin markdown, sin bloques de código, sin texto adicional.
- El JSON debe ser parseable directamente con JSON.parse().
- El campo "elements" debe tener al menos 1 elemento y como máximo ${MAX_ELEMENTS_PER_PLAY}.
- El campo "summary" es obligatorio, en español, 2-4 oraciones describiendo la jugada técnicamente.
- El campo "warnings" es obligatorio (puede ser []).
- Si solicitan un asset que no está en el catálogo, usa el más cercano disponible y añade una advertencia.

ESQUEMA EXACTO DE RESPUESTA:
{
  "backgroundId": "<backgroundId del catálogo, o null si el entrenador no especificó>",
  "elements": [ ...elementos ],
  "summary": "<descripción técnica en español>",
  "warnings": [ "<advertencia si aplica>" ]
}`;
  }

  // ─── User prompt ────────────────────────────────────────────────────────────

  private buildUserPrompt(
    dto: GeneratePlayDto,
    exerciseName: string,
    objective: string | null,
  ): string {
    const lines: string[] = [
      `Ejercicio: "${exerciseName}"`,
      `Descripción del entrenador: ${dto.prompt}`,
    ];

    if (objective) lines.push(`Objetivo técnico del ejercicio: ${objective}`);
    if (dto.category) lines.push(`Categoría: ${dto.category}`);
    if (dto.goalkeepersCount)
      lines.push(`Número de porteros en el ejercicio: ${dto.goalkeepersCount}`);
    if (dto.backgroundId)
      lines.push(`Fondo preferido por el entrenador: "${dto.backgroundId}"`);

    lines.push(
      `Genera la jugada táctica completa. Posiciona los elementos para que sean visualmente claros, bien espaciados y pedagógicamente correctos para un entrenador de porteros.`,
    );

    return lines.join('\n');
  }

  // ─── OpenAI call ────────────────────────────────────────────────────────────

  private async callOpenAI(
    apiKey: string,
    system: string,
    user: string,
  ): Promise<string> {
    let response: Response;

    try {
      response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.35,
          max_tokens: 2048,
          // response_format json_object garantiza JSON válido sin bloque de código
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
    } catch (error) {
      this.logger.error('OpenAI network error', error);
      throw new InternalServerErrorException(
        'No se pudo conectar con el servicio de IA. Verifica la conexión.',
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`OpenAI HTTP ${response.status}: ${body}`);
      throw new InternalServerErrorException(
        `El servicio de IA devolvió un error (${response.status}). Intenta de nuevo.`,
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      throw new InternalServerErrorException(
        'El servicio de IA no devolvió contenido. Intenta de nuevo.',
      );
    }

    return content;
  }

  // ─── Parser y normalizador ──────────────────────────────────────────────────

  private parseAndNormalize(
    rawText: string,
    requestedBackgroundId: string | undefined,
  ): GeneratePlayResponseDto {
    const warnings: string[] = [];

    let parsed: RawAIPlay;
    try {
      parsed = JSON.parse(rawText) as RawAIPlay;
    } catch {
      throw new InternalServerErrorException(
        'La IA devolvió JSON malformado. Intenta de nuevo.',
      );
    }

    // Advertencias que la propia IA haya reportado
    if (Array.isArray(parsed.warnings)) {
      warnings.push(
        ...parsed.warnings.filter((w): w is string => typeof w === 'string'),
      );
    }

    // Resolver fondo: el entrenador tiene prioridad sobre la sugerencia de la IA
    const bgId = requestedBackgroundId ?? parsed.backgroundId ?? null;
    const resolvedBg = bgId ? CATALOG_BACKGROUND_BY_ID.get(bgId) : undefined;
    if (bgId && !resolvedBg) {
      warnings.push(
        `Fondo "${bgId}" no encontrado en el catálogo; el editor usará el fondo actual.`,
      );
    }

    // Normalizar elementos
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
        'La IA no generó elementos válidos. Intenta con un prompt más específico.',
      );
    }

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Jugada generada automáticamente.';

    return {
      backgroundId: resolvedBg?.backgroundId ?? null,
      backgroundSrc: resolvedBg?.src ?? null,
      elements,
      summary,
      warnings,
    };
  }

  // ─── Normalizador por tipo de elemento ─────────────────────────────────────

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

    // ── asset ──────────────────────────────────────────────────────────────────
    if (kind === 'asset') {
      const assetId = typeof el.assetId === 'string' ? el.assetId : '';
      const catalogEntry = CATALOG_ASSET_BY_ID.get(assetId);
      if (!catalogEntry) {
        warnings.push(
          `Asset "${assetId}" no está en el catálogo y fue descartado.`,
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

    // ── arrow / line ───────────────────────────────────────────────────────────
    // x/y del elemento siempre es 0,0 (geometría usa points en coordenadas absolutas)
    // points: [x1, y1, midX, midY, x2, y2] coincide con createStrokeElement
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
        // x/y del elemento en 0,0 — los points llevan las coordenadas absolutas
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

    // ── text ───────────────────────────────────────────────────────────────────
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

    // ── rect ───────────────────────────────────────────────────────────────────
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
      `Tipo de elemento "${kind}" no está soportado y fue descartado.`,
    );
    return null;
  }
}
