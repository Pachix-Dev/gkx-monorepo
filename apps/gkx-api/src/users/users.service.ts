import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Not, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity, UserStatus } from './user.entity';
import { PlanLimitsService } from '../plan-limits/plan-limits.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create users');
    }

    this.assertRoleIsNotSuperAdmin(dto.role);

    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
    await this.planLimitsService.assertWithinLimit(tenantId, 'users');

    const email = dto.email.toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = this.usersRepository.create({
      tenantId,
      fullName: dto.fullName,
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role ?? Role.USER,
      status: dto.status ?? UserStatus.ACTIVE,
    });

    return this.usersRepository.save(user);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.USER) {
      return this.usersRepository.find({
        where: {
          tenantId: actor.tenantId,
          role: Not(Role.SUPER_ADMIN),
        },
        relations: { tenant: true },
        order: { createdAt: 'DESC' },
      });
    }

    return this.usersRepository.find({
      where: { role: Not(Role.SUPER_ADMIN) },
      relations: { tenant: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new NotFoundException('User not found');
    }

    this.assertTenantAccess(user, actor);

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    const user = await this.findOne(id, actor);

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'SUPER_ADMIN users can only be managed via bootstrap/seed',
      );
    }

    this.assertRoleIsNotSuperAdmin(dto.role);

    if (dto.tenantId) {
      if (actor.role === Role.USER && dto.tenantId !== actor.tenantId) {
        throw new ForbiddenException(
          'USER can only manage users within the same tenant',
        );
      }
      await this.ensureTenantExists(dto.tenantId);
    }

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.tenantId) user.tenantId = dto.tenantId;
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;

    return this.usersRepository.save(user);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const user = await this.findOne(id, actor);

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'SUPER_ADMIN users can only be managed via bootstrap/seed',
      );
    }

    await this.usersRepository.remove(user);

    return { deleted: true };
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({
      where: {
        id: tenantId,
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private assertRoleIsNotSuperAdmin(role?: Role) {
    if (role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'SUPER_ADMIN users can only be created via bootstrap/seed',
      );
    }
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role !== Role.USER) {
      return requestedTenantId;
    }

    if (requestedTenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'USER can only create users in the same tenant',
      );
    }

    return actor.tenantId;
  }

  private assertTenantAccess(user: UserEntity, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (actor.role === Role.USER && user.tenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'USER can only manage users within the same tenant',
      );
    }
  }
}
