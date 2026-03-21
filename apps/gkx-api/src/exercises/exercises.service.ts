import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TacticalPreviewStorageService } from '../common/storage/tactical-preview-storage.service';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { UpdateTacticalDesignDto } from './dto/update-tactical-design.dto';
import { ExerciseEntity } from './exercise.entity';

interface ExerciseFilters {
  trainingContentId?: string;
  difficulty?: string;
  search?: string;
}

interface UploadedTacticalPreview {
  mimetype: string;
  buffer: Buffer;
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
    private readonly tacticalPreviewStorage: TacticalPreviewStorageService,
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
    });

    return this.exercisesRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.exercisesRepository.remove(entity);
    return { deleted: true };
  }

  async getTacticalDesign(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    return {
      exerciseId: entity.id,
      state: entity.tacticalState ?? null,
      stateVersion: entity.tacticalStateVersion ?? 1,
      previewUrl: entity.tacticalPreviewUrl ?? null,
      updatedAt: entity.tacticalUpdatedAt?.toISOString() ?? entity.updatedAt?.toISOString(),
    };
  }

  async updateTacticalDesign(
    id: string,
    dto: UpdateTacticalDesignDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    // Use state hash for tactical hash tracking (to detect changes)
    const stateHash = this.calculateHash(dto.state);
    const previewHash = dto.previewHash ?? this.calculateHash(dto.previewUrl ?? '');

    Object.assign(entity, {
      tacticalState: dto.state,
      tacticalStateVersion: dto.stateVersion ?? (entity.tacticalStateVersion ?? 0) + 1,
      tacticalPreviewUrl: dto.previewUrl ?? entity.tacticalPreviewUrl,
      tacticalHash: stateHash || previewHash,
      tacticalUpdatedAt: new Date(),
    });

    await this.exercisesRepository.save(entity);

    return {
      exerciseId: entity.id,
      state: entity.tacticalState,
      stateVersion: entity.tacticalStateVersion,
      previewUrl: entity.tacticalPreviewUrl,
      updatedAt: entity.tacticalUpdatedAt?.toISOString(),
    };
  }

  async updateTacticalPreview(
    id: string,
    file: UploadedTacticalPreview,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);
    const previewUrl = await this.tacticalPreviewStorage.saveTacticalPreview({
      tenantId: entity.tenantId,
      exerciseId: entity.id,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    Object.assign(entity, {
      tacticalPreviewUrl: previewUrl,
      tacticalUpdatedAt: new Date(),
    });

    await this.exercisesRepository.save(entity);

    return {
      exerciseId: entity.id,
      state: entity.tacticalState ?? null,
      stateVersion: entity.tacticalStateVersion ?? 1,
      previewUrl: entity.tacticalPreviewUrl,
      updatedAt: entity.tacticalUpdatedAt?.toISOString() ?? entity.updatedAt?.toISOString(),
    };
  }

  private calculateHash(data: unknown): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
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
