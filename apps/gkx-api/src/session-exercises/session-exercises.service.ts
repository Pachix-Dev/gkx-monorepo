import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { ExerciseEntity } from '../exercises/exercise.entity';
import { SessionContentEntity } from '../session-contents/session-content.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { CreateSessionExerciseDto } from './dto/create-session-exercise.dto';
import { UpdateSessionExerciseDto } from './dto/update-session-exercise.dto';
import { SessionExerciseEntity } from './session-exercise.entity';

@Injectable()
export class SessionExercisesService {
  constructor(
    @InjectRepository(SessionExerciseEntity)
    private readonly sessionExercisesRepository: Repository<SessionExerciseEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(SessionContentEntity)
    private readonly sessionContentsRepository: Repository<SessionContentEntity>,
    @InjectRepository(ExerciseEntity)
    private readonly exercisesRepository: Repository<ExerciseEntity>,
  ) {}

  async create(dto: CreateSessionExerciseDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);

    const session = await this.ensureSessionBelongsToTenant(dto.sessionId, tenantId);
    const sessionContent = await this.ensureSessionContentBelongsToTenant(
      dto.sessionContentId,
      tenantId,
    );
    const exercise = await this.ensureExerciseBelongsToTenant(dto.exerciseId, tenantId);

    if (sessionContent.sessionId !== session.id) {
      throw new BadRequestException(
        'sessionContentId does not belong to the provided sessionId',
      );
    }

    const entity = this.sessionExercisesRepository.create({
      tenantId,
      sessionId: session.id,
      sessionContentId: sessionContent.id,
      exerciseId: exercise.id,
      order: dto.order ?? 0,
      selected: dto.selected ?? true,
      customDurationMinutes: dto.customDurationMinutes ?? null,
      customRepetitions: dto.customRepetitions ?? null,
      customRestSeconds: dto.customRestSeconds ?? null,
      coachNotes: dto.coachNotes ?? null,
    });

    return this.sessionExercisesRepository.save(entity);
  }

  async createForSession(
    sessionId: string,
    dto: CreateSessionExerciseDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.sessionId !== sessionId) {
      throw new BadRequestException('sessionId in body must match URL sessionId');
    }

    return this.create(dto, actor);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.sessionExercisesRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.sessionExercisesRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.sessionExercisesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Session exercise not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async findBySession(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    this.assertTenantAccess(session.tenantId, actor);

    return this.sessionExercisesRepository.find({
      where: { sessionId, tenantId: session.tenantId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateSessionExerciseDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    const nextSessionId = dto.sessionId ?? entity.sessionId;
    const nextSessionContentId = dto.sessionContentId ?? entity.sessionContentId;
    const nextExerciseId = dto.exerciseId ?? entity.exerciseId;

    await this.ensureSessionBelongsToTenant(nextSessionId, entity.tenantId);
    const sessionContent = await this.ensureSessionContentBelongsToTenant(
      nextSessionContentId,
      entity.tenantId,
    );
    await this.ensureExerciseBelongsToTenant(nextExerciseId, entity.tenantId);

    if (sessionContent.sessionId !== nextSessionId) {
      throw new BadRequestException(
        'sessionContentId does not belong to the provided sessionId',
      );
    }

    Object.assign(entity, {
      sessionId: nextSessionId,
      sessionContentId: nextSessionContentId,
      exerciseId: nextExerciseId,
      order: dto.order ?? entity.order,
      selected: dto.selected ?? entity.selected,
      customDurationMinutes:
        dto.customDurationMinutes ?? entity.customDurationMinutes,
      customRepetitions: dto.customRepetitions ?? entity.customRepetitions,
      customRestSeconds: dto.customRestSeconds ?? entity.customRestSeconds,
      coachNotes: dto.coachNotes ?? entity.coachNotes,
    });

    return this.sessionExercisesRepository.save(entity);
  }

  async updateWithinSession(
    sessionId: string,
    id: string,
    dto: UpdateSessionExerciseDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);
    if (entity.sessionId !== sessionId) {
      throw new BadRequestException('Session exercise does not belong to this session');
    }

    if (dto.sessionId && dto.sessionId !== sessionId) {
      throw new BadRequestException('sessionId in body must match URL sessionId');
    }

    return this.update(id, { ...dto, sessionId }, actor);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.sessionExercisesRepository.remove(entity);
    return { deleted: true };
  }

  async removeWithinSession(sessionId: string, id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    if (entity.sessionId !== sessionId) {
      throw new BadRequestException('Session exercise does not belong to this session');
    }

    return this.remove(id, actor);
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ) {
    if (actor.role === Role.SUPER_ADMIN) return requestedTenantId;
    if (requestedTenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only create records within your own tenant',
      );
    }
    return actor.tenantId;
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) return;
    if (tenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only access records within your own tenant',
      );
    }
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
  }

  private async ensureSessionBelongsToTenant(sessionId: string, tenantId: string) {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Training session not found');
    if (session.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training session does not belong to the provided tenant',
      );
    }
    return session;
  }

  private async ensureSessionContentBelongsToTenant(
    sessionContentId: string,
    tenantId: string,
  ) {
    const sessionContent = await this.sessionContentsRepository.findOne({
      where: { id: sessionContentId },
    });
    if (!sessionContent) throw new NotFoundException('Session content not found');
    if (sessionContent.tenantId !== tenantId) {
      throw new BadRequestException(
        'Session content does not belong to the provided tenant',
      );
    }
    return sessionContent;
  }

  private async ensureExerciseBelongsToTenant(exerciseId: string, tenantId: string) {
    const exercise = await this.exercisesRepository.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    if (exercise.tenantId !== tenantId) {
      throw new BadRequestException(
        'Exercise does not belong to the provided tenant',
      );
    }
    return exercise;
  }
}
