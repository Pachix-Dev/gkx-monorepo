import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
  ) {}

  async create(dto: CreateTrainingSessionDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
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

    const nextStartTime = dto.startTime ? new Date(dto.startTime) : entity.startTime;
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
      order: { order: 'ASC', createdAt: 'ASC' },
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
          order: { order: 'ASC', createdAt: 'ASC' },
        });

        const exerciseIds = rows.map((row) => row.exerciseId);
        const exercises = exerciseIds.length
          ? await this.exercisesRepository.findBy({ id: In(exerciseIds) })
          : [];
        const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

        return {
          task,
          exercises: rows.map((row) => ({
            assignment: row,
            exercise: byId.get(row.exerciseId) ?? null,
          })),
        };
      }),
    );

    const contentIds = tasks
      .map((task) => task.trainingContentId)
      .filter((id): id is string => Boolean(id));
    const trainingContents = contentIds.length
      ? await this.trainingContentsRepository.findBy({ id: In(contentIds) })
      : [];
    const contentById = new Map(trainingContents.map((content) => [content.id, content]));

    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

    let y = 800;
    const ensureSpace = () => {
      if (y >= 120) return;
      page = pdf.addPage([595, 842]);
      y = 800;
    };

    page.drawText(`Hoja de campo: ${session.title}`, {
      x: 40,
      y,
      size: 18,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 24;
    page.drawText(`Fecha: ${session.date} | Horario: ${session.startTime.toISOString()} - ${session.endTime.toISOString()}`, {
      x: 40,
      y,
      size: 10,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
    page.drawText(`Ubicacion: ${session.location ?? 'No definida'} | Estado: ${session.status}`, {
      x: 40,
      y,
      size: 10,
      font: bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 20;

    for (const taskGroup of exercisesByTask) {
      ensureSpace();

      const contentName = taskGroup.task.trainingContentId
        ? (contentById.get(taskGroup.task.trainingContentId)?.name ?? 'Contenido no encontrado')
        : 'Sin contenido asociado';

      page.drawText(`Tarea: ${taskGroup.task.taskName}`, {
        x: 40,
        y,
        size: 12,
        font: titleFont,
      });
      y -= 14;
      page.drawText(`Contenido: ${contentName} | Duracion: ${taskGroup.task.customDurationMinutes ?? '-'} min`, {
        x: 48,
        y,
        size: 9,
        font: bodyFont,
      });
      y -= 12;

      if (taskGroup.task.notes) {
        page.drawText(`Notas: ${taskGroup.task.notes}`, {
          x: 48,
          y,
          size: 9,
          font: bodyFont,
        });
        y -= 12;
      }

      for (const row of taskGroup.exercises) {
        const exerciseName = row.exercise?.name ?? 'Ejercicio no encontrado';
        const preview = row.assignment.tacticalPreviewUrlSnapshot ?? 'sin preview';
        page.drawText(
          `- ${exerciseName} | rep: ${row.assignment.customRepetitions ?? row.exercise?.repetitions ?? '-'} | dur: ${row.assignment.customDurationMinutes ?? row.exercise?.durationMinutes ?? '-'} min | preview: ${preview}`,
          {
            x: 56,
            y,
            size: 8,
            font: bodyFont,
          },
        );
        y -= 10;
        ensureSpace();
      }

      y -= 8;
    }

    const bytes = await pdf.save();
    const filename = `field-sheet-${session.date}-${session.id}.pdf`;
    return { bytes: Buffer.from(bytes), filename };
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
    if (session.tenantId !== actor.tenantId || session.createdByUserId !== actor.userId) {
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
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async ensureTeamBelongsToTenant(teamId: string | undefined, tenantId: string) {
    if (!teamId) return;

    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.tenantId !== tenantId) {
      throw new BadRequestException('Team does not belong to the provided tenant');
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
      throw new NotFoundException('One or more training contents were not found');
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
