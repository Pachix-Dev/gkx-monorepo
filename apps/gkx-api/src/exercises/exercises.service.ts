import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseEntity, ExerciseStatus } from './exercise.entity';

interface ExerciseFilters {
  trainingContentId?: string;
  difficulty?: string;
  search?: string;
}

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exercisesRepository: Repository<ExerciseEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TrainingContentEntity)
    private readonly contentsRepository: Repository<TrainingContentEntity>,
  ) {}

  async create(dto: CreateExerciseDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureContentBelongsToTenant(dto.trainingContentId, tenantId);

    const entity = this.exercisesRepository.create({
      tenantId,
      trainingContentId: dto.trainingContentId,
      name: dto.name,
      description: dto.description ?? null,
      instructions: dto.instructions ?? null,
      objective: dto.objective ?? null,
      durationMinutes: dto.durationMinutes ?? null,
      repetitions: dto.repetitions ?? null,
      restSeconds: dto.restSeconds ?? null,
      equipment: dto.equipment ?? null,
      videoUrl: dto.videoUrl ?? null,
      difficulty: dto.difficulty ?? null,
      order: dto.order ?? 0,
      status: dto.status ?? ExerciseStatus.ACTIVE,
    });

    return this.exercisesRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser, filters: ExerciseFilters = {}) {
    const where = {
      ...(actor.role === Role.SUPER_ADMIN ? {} : { tenantId: actor.tenantId }),
      ...(filters.trainingContentId
        ? { trainingContentId: filters.trainingContentId }
        : {}),
      ...(filters.difficulty ? { difficulty: ILike(filters.difficulty) } : {}),
      ...(filters.search ? { name: ILike(`%${filters.search}%`) } : {}),
    };

    if (actor.role === Role.SUPER_ADMIN) {
      return this.exercisesRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
    }

    return this.exercisesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.exercisesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Exercise not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(id: string, dto: UpdateExerciseDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.trainingContentId) {
      await this.ensureContentBelongsToTenant(dto.trainingContentId, entity.tenantId);
    }

    Object.assign(entity, {
      trainingContentId: dto.trainingContentId ?? entity.trainingContentId,
      name: dto.name ?? entity.name,
      description: dto.description ?? entity.description,
      instructions: dto.instructions ?? entity.instructions,
      objective: dto.objective ?? entity.objective,
      durationMinutes: dto.durationMinutes ?? entity.durationMinutes,
      repetitions: dto.repetitions ?? entity.repetitions,
      restSeconds: dto.restSeconds ?? entity.restSeconds,
      equipment: dto.equipment ?? entity.equipment,
      videoUrl: dto.videoUrl ?? entity.videoUrl,
      difficulty: dto.difficulty ?? entity.difficulty,
      order: dto.order ?? entity.order,
      status: dto.status ?? entity.status,
    });

    return this.exercisesRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.exercisesRepository.remove(entity);
    return { deleted: true };
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

  private async ensureContentBelongsToTenant(
    trainingContentId: string,
    tenantId: string,
  ) {
    const content = await this.contentsRepository.findOne({
      where: { id: trainingContentId },
    });
    if (!content) throw new NotFoundException('Training content not found');

    if (content.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training content does not belong to the provided tenant',
      );
    }
  }
}
