import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { ExerciseEntity } from '../exercises/exercise.entity';
import { SessionContentEntity } from '../session-contents/session-content.entity';
import { SessionExerciseEntity } from '../session-exercises/session-exercise.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TeamEntity } from '../teams/team.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';
import {
  TrainingSessionEntity,
  TrainingSessionStatus,
} from './training-session.entity';
import { PlanLimitsService } from '../plan-limits/plan-limits.service';

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(SessionContentEntity)
    private readonly sessionContentsRepository: Repository<SessionContentEntity>,
    @InjectRepository(SessionExerciseEntity)
    private readonly sessionExercisesRepository: Repository<SessionExerciseEntity>,
    @InjectRepository(ExerciseEntity)
    private readonly exercisesRepository: Repository<ExerciseEntity>,
    @InjectRepository(TrainingContentEntity)
    private readonly trainingContentsRepository: Repository<TrainingContentEntity>,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(dto: CreateTrainingSessionDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
    await this.planLimitsService.assertWithinLimit(
      tenantId,
      'sessionsPerMonth',
    );
    await this.ensureTeamBelongsToTenant(dto.teamId, tenantId);
    const trainingContentIds = await this.ensureTrainingContentsBelongToTenant(
      dto.trainingContentIds,
      tenantId,
    );

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.assertTimeRange(startTime, endTime);

    const entity = this.sessionsRepository.create({
      tenantId,
      createdByUserId: actor.userId,
      title: dto.title,
      trainingContentIds,
      description: dto.description ?? null,
      date: dto.date,
      startTime,
      endTime,
      teamId: dto.teamId ?? null,
      location: dto.location ?? null,
      notes: dto.notes ?? null,
      status: dto.status ?? TrainingSessionStatus.DRAFT,
    });

    return this.sessionsRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.sessionsRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.sessionsRepository.find({
      where: { tenantId: actor.tenantId, createdByUserId: actor.userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.sessionsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Training session not found');
    }

    this.assertSessionAccess(entity, actor);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateTrainingSessionDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.teamId) {
      await this.ensureTeamBelongsToTenant(dto.teamId, entity.tenantId);
    }

    const nextTrainingContentIds = dto.trainingContentIds
      ? await this.ensureTrainingContentsBelongToTenant(
          dto.trainingContentIds,
          entity.tenantId,
        )
      : entity.trainingContentIds;

    const nextStartTime = dto.startTime
      ? new Date(dto.startTime)
      : entity.startTime;
    const nextEndTime = dto.endTime ? new Date(dto.endTime) : entity.endTime;
    this.assertTimeRange(nextStartTime, nextEndTime);

    Object.assign(entity, {
      title: dto.title ?? entity.title,
      description: dto.description ?? entity.description,
      trainingContentIds: nextTrainingContentIds,
      date: dto.date ?? entity.date,
      startTime: nextStartTime,
      endTime: nextEndTime,
      teamId: dto.teamId ?? entity.teamId,
      location: dto.location ?? entity.location,
      notes: dto.notes ?? entity.notes,
      status: dto.status ?? entity.status,
    });

    return this.sessionsRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.sessionsRepository.remove(entity);
    return { deleted: true };
  }

  async buildFieldSheetPdf(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.findOne(sessionId, actor);

    const tasks = await this.sessionContentsRepository.find({
      where: { sessionId: session.id, tenantId: session.tenantId },
      order: { createdAt: 'ASC' },
    });

    const exercisesByTask = await Promise.all(
      tasks.map(async (task) => {
        const rows = await this.sessionExercisesRepository.find({
          where: {
            sessionId: session.id,
            sessionContentId: task.id,
            tenantId: session.tenantId,
            selected: true,
          },
          order: { createdAt: 'ASC' },
        });

        const exerciseIds = rows.map((row) => row.exerciseId);
        const exercises = exerciseIds.length
          ? await this.exercisesRepository.findBy({ id: In(exerciseIds) })
          : [];
        const byId = new Map(
          exercises.map((exercise) => [exercise.id, exercise]),
        );

        return {
          task,
          exercises: rows.map((row) => ({
            assignment: row,
            exercise: byId.get(row.exerciseId) ?? null,
          })),
        };
      }),
    );

    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
    const pageWidth = 595;
    const pageHeight = 842;
    const marginX = 36;
    const gutter = 14;
    const contentWidth = pageWidth - marginX * 2;
    const sectionGapY = 14;
    const cardBottomLimit = 48;

    // Color palette from GKX theme
    const primaryColor = rgb(0.78, 0.97, 0.01); // #c7f703
    const primaryDark = rgb(0.76, 0.85, 0.29); // #c3da4b
    const darkText = rgb(0.09, 0.12, 0.18); // #1a1c2e
    const mediumText = rgb(0.2, 0.24, 0.29); // #343d4a
    const lightBg = rgb(0.96, 0.96, 0.96); // #f5f5f5
    const borderColor = rgb(0.9, 0.91, 0.92); // #e5e7eb
    const whiteText = rgb(0.97, 0.98, 0.99);

    const friendlyDate = this.formatFriendlyDate(session.date);
    const friendlyStartTime = this.formatFriendlyTime(session.startTime);
    const friendlyEndTime = this.formatFriendlyTime(session.endTime);
    const sessionDuration = this.formatSessionDuration(
      session.startTime,
      session.endTime,
    );

    let y = 0;
    const resetPage = () => {
      page = pdf.addPage([595, 842]);
      y = 786;
    };

    const headerHeight = 92;

    // Premium header with dark background and accent stripe
    page.drawRectangle({
      x: 0,
      y: pageHeight - headerHeight,
      width: pageWidth,
      height: headerHeight,
      color: darkText,
      borderColor: darkText,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 0,
      y: pageHeight - 4,
      width: pageWidth,
      height: 4,
      color: primaryColor,
    });

    page.drawText(`Sesión: ${session.title}`, {
      x: marginX + 14,
      y: pageHeight - 32,
      size: 18,
      font: titleFont,
      color: whiteText,
    });

    page.drawText(`Fecha: ${friendlyDate}`, {
      x: marginX + 14,
      y: pageHeight - 54,
      size: 10,
      font: bodyFont,
      color: whiteText,
    });

    page.drawText(
      `Horario: ${friendlyStartTime} - ${friendlyEndTime} (${sessionDuration})`,
      {
        x: marginX + 14,
        y: pageHeight - 68,
        size: 10,
        font: bodyFont,
        color: whiteText,
      },
    );

    const rightMeta = `Ubicación: ${session.location ?? 'No definida'} | Tareas: ${exercisesByTask.length}`;
    page.drawText(this.truncateText(rightMeta, bodyFont, 10, 250), {
      x: pageWidth - marginX - 264,
      y: pageHeight - 54,
      size: 10,
      font: bodyFont,
      color: whiteText,
    });

    y = pageHeight - headerHeight - 12;

    const hasDescription = Boolean(session.description?.trim());
    const hasNotes = Boolean(session.notes?.trim());
    if (hasDescription || hasNotes) {
      const descLines = hasDescription
        ? this.wrapText(
            session.description ?? '',
            bodyFont,
            9,
            contentWidth - 24,
          ).slice(0, 2)
        : [];
      const notesLines = hasNotes
        ? this.wrapText(
            session.notes ?? '',
            bodyFont,
            9,
            contentWidth - 24,
          ).slice(0, 2)
        : [];

      const summaryLinesCount =
        (hasDescription ? 1 + descLines.length : 0) +
        (hasNotes ? 1 + notesLines.length : 0);
      const summaryHeight = 18 + summaryLinesCount * 11;

      page.drawRectangle({
        x: marginX,
        y: y - summaryHeight,
        width: contentWidth,
        height: summaryHeight,
        color: rgb(1, 1, 1),
        borderColor,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: marginX,
        y: y - summaryHeight,
        width: 4,
        height: summaryHeight,
        color: primaryDark,
      });

      let summaryY = y - 16;
      if (hasDescription) {
        page.drawText('Descripción', {
          x: marginX + 10,
          y: summaryY,
          size: 9,
          font: titleFont,
          color: darkText,
        });
        summaryY -= 11;
        for (const line of descLines) {
          page.drawText(line, {
            x: marginX + 10,
            y: summaryY,
            size: 9,
            font: bodyFont,
            color: mediumText,
          });
          summaryY -= 11;
        }
      }

      if (hasNotes) {
        page.drawText('Notas', {
          x: marginX + 10,
          y: summaryY,
          size: 9,
          font: titleFont,
          color: darkText,
        });
        summaryY -= 11;
        for (const line of notesLines) {
          page.drawText(line, {
            x: marginX + 10,
            y: summaryY,
            size: 9,
            font: bodyFont,
            color: mediumText,
          });
          summaryY -= 11;
        }
      }

      y -= summaryHeight + 10;
    }

    for (const taskGroup of exercisesByTask) {
      const hasMultipleExercises = taskGroup.exercises.length > 1;
      const exerciseColumns = hasMultipleExercises ? 2 : 1;
      const exerciseCardWidth =
        exerciseColumns === 2 ? (contentWidth - gutter) / 2 : contentWidth;
      const previewHeight = exerciseColumns === 2 ? 172 : 260;
      const exerciseCardHeight = previewHeight + 40;
      const minTaskHeaderHeight = 52;

      if (
        y - (minTaskHeaderHeight + exerciseCardHeight + 10) <
        cardBottomLimit
      ) {
        resetPage();
      }

      // Task section card
      page.drawRectangle({
        x: marginX,
        y: y - minTaskHeaderHeight,
        width: contentWidth,
        height: minTaskHeaderHeight,
        color: rgb(1, 1, 1),
        borderColor,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: marginX,
        y: y - minTaskHeaderHeight,
        width: 5,
        height: minTaskHeaderHeight,
        color: primaryColor,
      });

      page.drawText(
        this.truncateText(
          `Tarea: ${taskGroup.task.taskName}`,
          titleFont,
          12,
          contentWidth - 20,
        ),
        {
          x: marginX + 10,
          y: y - 18,
          size: 12,
          font: titleFont,
          color: darkText,
        },
      );

      page.drawText(
        this.truncateText(
          `${taskGroup.exercises.length} ${taskGroup.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`,
          bodyFont,
          9,
          contentWidth - 20,
        ),
        {
          x: marginX + 10,
          y: y - 34,
          size: 9,
          font: bodyFont,
          color: primaryDark,
        },
      );

      y -= minTaskHeaderHeight + 6;

      if (!taskGroup.exercises.length) {
        if (y - 26 < cardBottomLimit) {
          resetPage();
        }
        page.drawText('Sin ejercicios seleccionados para esta tarea.', {
          x: marginX + 4,
          y,
          size: 9,
          font: bodyFont,
          color: mediumText,
        });
        y -= 26;
        y -= sectionGapY;
        continue;
      }

      for (
        let index = 0;
        index < taskGroup.exercises.length;
        index += exerciseColumns
      ) {
        if (y - exerciseCardHeight < cardBottomLimit) {
          resetPage();
          page.drawText(
            this.truncateText(
              `Tarea (continuación): ${taskGroup.task.taskName}`,
              titleFont,
              11,
              contentWidth,
            ),
            {
              x: marginX,
              y,
              size: 11,
              font: titleFont,
              color: darkText,
            },
          );
          y -= 16;
        }

        const left = taskGroup.exercises[index];
        await this.drawExerciseCard({
          pdf,
          page,
          titleFont,
          bodyFont,
          x: marginX,
          topY: y,
          width: exerciseCardWidth,
          height: exerciseCardHeight,
          previewHeight,
          row: left,
          primaryColor,
          darkText,
          mediumText,
          lightBg,
          borderColor,
        });

        const right = taskGroup.exercises[index + 1];
        if (exerciseColumns === 2 && right) {
          await this.drawExerciseCard({
            pdf,
            page,
            titleFont,
            bodyFont,
            x: marginX + exerciseCardWidth + gutter,
            topY: y,
            width: exerciseCardWidth,
            height: exerciseCardHeight,
            previewHeight,
            row: right,
            primaryColor,
            darkText,
            mediumText,
            lightBg,
            borderColor,
          });
        }

        y -= exerciseCardHeight + 4;
      }

      y -= 2;
    }

    const bytes = await pdf.save();
    const filename = `field-sheet-${session.date}-${session.id}.pdf`;
    return { bytes: Buffer.from(bytes), filename };
  }

  private async drawExerciseCard(params: {
    pdf: PDFDocument;
    page: PDFPage;
    titleFont: PDFFont;
    bodyFont: PDFFont;
    x: number;
    topY: number;
    width: number;
    height: number;
    previewHeight: number;
    row: {
      assignment: SessionExerciseEntity;
      exercise: ExerciseEntity | null;
    };
    primaryColor: ReturnType<typeof rgb>;
    darkText: ReturnType<typeof rgb>;
    mediumText: ReturnType<typeof rgb>;
    lightBg: ReturnType<typeof rgb>;
    borderColor: ReturnType<typeof rgb>;
  }) {
    const {
      pdf,
      page,
      titleFont,
      bodyFont,
      x,
      topY,
      width,
      height,
      previewHeight,
      row,
      primaryColor,
      darkText,
      mediumText,
      lightBg,
      borderColor,
    } = params;

    const exerciseName = row.exercise?.name ?? 'Ejercicio no encontrado';
    const reps = row.exercise?.repetitions ?? '-';
    const duration = row.exercise?.durationMinutes ?? '-';

    const cardBottomY = topY - height;
    const padding = 8;

    page.drawRectangle({
      x,
      y: cardBottomY,
      width,
      height,
      color: rgb(1, 1, 1),
      borderColor,
      borderWidth: 1,
    });

    page.drawRectangle({
      x,
      y: topY - 2,
      width,
      height: 2,
      color: primaryColor,
    });

    page.drawText(
      this.truncateText(exerciseName, titleFont, 10, width - padding * 2),
      {
        x: x + padding,
        y: topY - 16,
        size: 10,
        font: titleFont,
        color: darkText,
      },
    );

    page.drawText(`Rep: ${reps} | Duración: ${duration} min`, {
      x: x + padding,
      y: topY - 30,
      size: 8,
      font: bodyFont,
      color: mediumText,
    });

    const previewBoxX = x + padding;
    const previewBoxY = topY - 34 - previewHeight;
    const previewBoxWidth = width - padding * 2;
    const previewBoxHeight = previewHeight;

    page.drawRectangle({
      x: previewBoxX,
      y: previewBoxY,
      width: previewBoxWidth,
      height: previewBoxHeight,
      color: lightBg,
      borderColor,
      borderWidth: 0.5,
    });

    const previewUrl = row.assignment.tacticalPreviewUrlSnapshot;

    if (previewUrl) {
      const embeddedPreview = await this.embedTacticalPreview(pdf, previewUrl);
      if (embeddedPreview) {
        const ratio = embeddedPreview.height / embeddedPreview.width;
        const availableWidth = previewBoxWidth;
        const availableHeight = previewBoxHeight;
        let renderWidth = availableWidth;
        let renderHeight = renderWidth * ratio;
        if (renderHeight > availableHeight) {
          renderHeight = availableHeight;
          renderWidth = renderHeight / ratio;
        }

        page.drawImage(embeddedPreview.image, {
          x: previewBoxX + (previewBoxWidth - renderWidth) / 2,
          y: previewBoxY + (previewBoxHeight - renderHeight) / 2,
          width: renderWidth,
          height: renderHeight,
        });
      } else {
        page.drawText('Preview no compatible', {
          x: previewBoxX + 10,
          y: previewBoxY + previewBoxHeight / 2,
          size: 9,
          font: bodyFont,
          color: mediumText,
        });
      }
    } else {
      page.drawText('Sin preview', {
        x: previewBoxX + 10,
        y: previewBoxY + previewBoxHeight / 2,
        size: 10,
        font: bodyFont,
        color: mediumText,
      });
    }
  }

  private formatFriendlyDate(rawDate: string) {
    const value = new Date(`${rawDate}T00:00:00`);
    if (Number.isNaN(value.getTime())) return rawDate;

    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(value);
  }

  private formatFriendlyTime(value: Date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(value);
  }

  private formatSessionDuration(start: Date, end: Date) {
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const minutes = Math.round(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (hours <= 0) return `${rest} min`;
    if (rest <= 0) return `${hours} h`;
    return `${hours} h ${rest} min`;
  }

  private truncateText(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
  ) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

    const ellipsis = '...';
    let value = text;
    while (value.length > 0) {
      value = value.slice(0, -1);
      const candidate = `${value}${ellipsis}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        return candidate;
      }
    }

    return ellipsis;
  }

  private wrapText(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
  ) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines;
  }

  private async embedTacticalPreview(pdf: PDFDocument, previewUrl: string) {
    const bytes = await this.loadPreviewBytes(previewUrl);
    if (!bytes) return null;

    if (this.isPng(bytes)) {
      const image = await pdf.embedPng(bytes);
      return { image, width: image.width, height: image.height };
    }

    if (this.isJpeg(bytes)) {
      const image = await pdf.embedJpg(bytes);
      return { image, width: image.width, height: image.height };
    }

    return null;
  }

  private async loadPreviewBytes(previewUrl: string) {
    try {
      if (previewUrl.startsWith('/uploads/')) {
        const localPath = resolve(
          process.cwd(),
          process.env.LOCAL_UPLOADS_DIR ?? 'uploads',
          previewUrl.replace('/uploads/', ''),
        );
        const file = await readFile(localPath);
        return Uint8Array.from(file);
      }

      const response = await fetch(previewUrl);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch {
      return null;
    }
  }

  private isPng(bytes: Uint8Array) {
    return (
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  private isJpeg(bytes: Uint8Array) {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role === Role.SUPER_ADMIN) return requestedTenantId;
    if (requestedTenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only create records within your own tenant',
      );
    }
    return actor.tenantId;
  }

  private assertSessionAccess(
    session: Pick<TrainingSessionEntity, 'tenantId' | 'createdByUserId'>,
    actor: AuthenticatedUser,
  ) {
    if (actor.role === Role.SUPER_ADMIN) return;
    if (
      session.tenantId !== actor.tenantId ||
      session.createdByUserId !== actor.userId
    ) {
      throw new ForbiddenException(
        'You can only access your own training sessions',
      );
    }
  }

  private assertTimeRange(startTime: Date, endTime: Date) {
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async ensureTeamBelongsToTenant(
    teamId: string | undefined,
    tenantId: string,
  ) {
    if (!teamId) return;

    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.tenantId !== tenantId) {
      throw new BadRequestException(
        'Team does not belong to the provided tenant',
      );
    }
  }

  private async ensureTrainingContentsBelongToTenant(
    contentIds: string[],
    tenantId: string,
  ) {
    const uniqueIds = [...new Set(contentIds)];

    if (uniqueIds.length === 0) {
      throw new BadRequestException(
        'trainingContentIds must contain at least one item',
      );
    }

    const contents = await this.trainingContentsRepository.findBy({
      id: In(uniqueIds),
    });

    if (contents.length !== uniqueIds.length) {
      throw new NotFoundException(
        'One or more training contents were not found',
      );
    }

    for (const content of contents) {
      if (content.tenantId !== tenantId) {
        throw new BadRequestException(
          'Training content does not belong to the provided tenant',
        );
      }
    }

    return uniqueIds;
  }
}
