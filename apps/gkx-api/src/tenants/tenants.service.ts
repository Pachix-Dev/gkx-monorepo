import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantEntity, TenantPlan, TenantStatus } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
  ) {}

  async create(dto: CreateTenantDto) {
    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.tenantsRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const tenant = this.tenantsRepository.create({
      name: dto.name,
      slug,
      plan: dto.plan ?? TenantPlan.FREE,
      status: dto.status ?? TenantStatus.ACTIVE,
    });

    return this.tenantsRepository.save(tenant);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.USER) {
      const tenant = await this.tenantsRepository.findOne({
        where: { id: actor.tenantId },
      });
      return tenant ? [tenant] : [];
    }

    return this.tenantsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    this.assertTenantAccess(id, actor);

    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, actor: AuthenticatedUser) {
    const tenant = await this.findOne(id, actor);

    if (dto.slug && dto.slug !== tenant.slug) {
      const slugUsed = await this.tenantsRepository.findOne({
        where: { slug: dto.slug },
      });
      if (slugUsed) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    Object.assign(tenant, dto);
    return this.tenantsRepository.save(tenant);
  }

  async remove(id: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantsRepository.remove(tenant);

    return { deleted: true };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (actor.role === Role.USER && actor.tenantId !== tenantId) {
      throw new ForbiddenException(
        'USER can only access its own tenant',
      );
    }
  }
}
