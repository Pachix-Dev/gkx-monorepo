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
import { TenantEntity } from '../tenants/tenant.entity';
import { CreateTrainingLineDto } from './dto/create-training-line.dto';
import { UpdateTrainingLineDto } from './dto/update-training-line.dto';
import { TrainingLineEntity, TrainingLineStatus } from './training-line.entity';

@Injectable()
export class TrainingLinesService {
  constructor(
    @InjectRepository(TrainingLineEntity)
    private readonly trainingLinesRepository: Repository<TrainingLineEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
  ) {}

  async create(dto: CreateTrainingLineDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);

    const entity = this.trainingLinesRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? null,
      icon: dto.icon ?? null,
      order: dto.order ?? 0,
      status: dto.status ?? TrainingLineStatus.ACTIVE,
    });

    return this.trainingLinesRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.trainingLinesRepository.find({ order: { order: 'ASC' } });
    }

    return this.trainingLinesRepository.find({
      where: { tenantId: actor.tenantId },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.trainingLinesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Training line not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateTrainingLineDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    Object.assign(entity, {
      name: dto.name ?? entity.name,
      description: dto.description ?? entity.description,
      color: dto.color ?? entity.color,
      icon: dto.icon ?? entity.icon,
      order: dto.order ?? entity.order,
      status: dto.status ?? entity.status,
    });

    return this.trainingLinesRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.trainingLinesRepository.remove(entity);
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
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

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
}
