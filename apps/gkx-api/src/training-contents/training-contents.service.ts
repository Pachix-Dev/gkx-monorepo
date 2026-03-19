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
import { TrainingLineEntity } from '../training-lines/training-line.entity';
import { UserEntity } from '../users/user.entity';
import { CreateTrainingContentDto } from './dto/create-training-content.dto';
import { UpdateTrainingContentDto } from './dto/update-training-content.dto';
import {
  TrainingContentEntity,
  TrainingContentStatus,
} from './training-content.entity';

interface TrainingContentFilters {
  trainingLineId?: string;
  level?: string;
  search?: string;
}

@Injectable()
export class TrainingContentsService {
  constructor(
    @InjectRepository(TrainingContentEntity)
    private readonly contentsRepository: Repository<TrainingContentEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TrainingLineEntity)
    private readonly linesRepository: Repository<TrainingLineEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateTrainingContentDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureLineBelongsToTenant(dto.trainingLineId, tenantId);
    await this.ensureCreatorBelongsToTenant(dto.createdBy, tenantId);

    const entity = this.contentsRepository.create({
      tenantId,
      trainingLineId: dto.trainingLineId,
      name: dto.name,
      description: dto.description ?? null,
      objective: dto.objective ?? null,
      level: dto.level ?? null,
      estimatedDurationMinutes: dto.estimatedDurationMinutes ?? null,
      createdBy: dto.createdBy ?? null,
      status: dto.status ?? TrainingContentStatus.ACTIVE,
    });

    return this.contentsRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser, filters: TrainingContentFilters = {}) {
    const where = {
      ...(actor.role === Role.SUPER_ADMIN ? {} : { tenantId: actor.tenantId }),
      ...(filters.trainingLineId ? { trainingLineId: filters.trainingLineId } : {}),
      ...(filters.level ? { level: ILike(filters.level) } : {}),
      ...(filters.search ? { name: ILike(`%${filters.search}%`) } : {}),
    };

    if (actor.role === Role.SUPER_ADMIN) {
      return this.contentsRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
    }

    return this.contentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.contentsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Training content not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateTrainingContentDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.trainingLineId) {
      await this.ensureLineBelongsToTenant(dto.trainingLineId, entity.tenantId);
    }

    if (dto.createdBy) {
      await this.ensureCreatorBelongsToTenant(dto.createdBy, entity.tenantId);
    }

    Object.assign(entity, {
      trainingLineId: dto.trainingLineId ?? entity.trainingLineId,
      name: dto.name ?? entity.name,
      description: dto.description ?? entity.description,
      objective: dto.objective ?? entity.objective,
      level: dto.level ?? entity.level,
      estimatedDurationMinutes:
        dto.estimatedDurationMinutes ?? entity.estimatedDurationMinutes,
      createdBy: dto.createdBy ?? entity.createdBy,
      status: dto.status ?? entity.status,
    });

    return this.contentsRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.contentsRepository.remove(entity);
    return { deleted: true };
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role === Role.SUPER_ADMIN) {
      return requestedTenantId;
    }

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
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async ensureLineBelongsToTenant(trainingLineId: string, tenantId: string) {
    const line = await this.linesRepository.findOne({ where: { id: trainingLineId } });
    if (!line) {
      throw new NotFoundException('Training line not found');
    }

    if (line.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training line does not belong to the provided tenant',
      );
    }
  }

  private async ensureCreatorBelongsToTenant(
    createdBy: string | undefined,
    tenantId: string,
  ) {
    if (!createdBy) return;

    const user = await this.usersRepository.findOne({ where: { id: createdBy } });
    if (!user) {
      throw new NotFoundException('Creator user not found');
    }

    if (user.tenantId !== tenantId) {
      throw new BadRequestException('Creator does not belong to the provided tenant');
    }
  }
}
