import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { CoachEntity } from './coach.entity';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(CoachEntity)
    private readonly coachesRepository: Repository<CoachEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateCoachDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureUserBelongsToTenant(dto.userId, tenantId);

    const existing = await this.coachesRepository.findOne({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Coach profile already exists for this user');
    }

    const entity = this.coachesRepository.create({
      tenantId,
      userId: dto.userId,
      specialty: dto.specialty ?? null,
      licenseLevel: dto.licenseLevel ?? null,
      experienceYears: dto.experienceYears ?? null,
    });

    return this.coachesRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.coachesRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.coachesRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.coachesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Coach profile not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(id: string, dto: UpdateCoachDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.userId && dto.userId !== entity.userId) {
      throw new BadRequestException('Changing userId is not allowed');
    }

    Object.assign(entity, {
      specialty: dto.specialty ?? entity.specialty,
      licenseLevel: dto.licenseLevel ?? entity.licenseLevel,
      experienceYears: dto.experienceYears ?? entity.experienceYears,
    });

    return this.coachesRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.coachesRepository.remove(entity);
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

  private async ensureUserBelongsToTenant(userId: string, tenantId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to the provided tenant');
    }
  }
}
