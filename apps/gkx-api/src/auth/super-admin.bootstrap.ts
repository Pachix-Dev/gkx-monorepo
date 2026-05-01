import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from './roles.enum';
import {
  TenantEntity,
  TenantPlan,
  TenantStatus,
} from '../tenants/tenant.entity';
import { UserEntity, UserStatus } from '../users/user.entity';

@Injectable()
export class SuperAdminBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminBootstrap.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async onApplicationBootstrap() {
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD?.trim();

    if (!email || !password) {
      this.logger.log(
        'SUPER_ADMIN bootstrap skipped: SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD are not set',
      );
      return;
    }

    if (password.length < 8) {
      this.logger.warn(
        'SUPER_ADMIN bootstrap skipped: SUPER_ADMIN_PASSWORD must be at least 8 characters',
      );
      return;
    }

    const tenantSlug =
      process.env.PLATFORM_TENANT_SLUG?.trim() || 'gkx-platform';
    const tenantName =
      process.env.PLATFORM_TENANT_NAME?.trim() || 'GKX Platform';
    const fullName =
      process.env.SUPER_ADMIN_FULL_NAME?.trim() || 'Platform Super Admin';

    let tenant = await this.tenantsRepository.findOne({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      tenant = this.tenantsRepository.create({
        name: tenantName,
        slug: tenantSlug,
        plan: TenantPlan.PRO,
        status: TenantStatus.ACTIVE,
      });
      tenant = await this.tenantsRepository.save(tenant);
      this.logger.log(`Platform tenant created: ${tenant.slug}`);
    }

    const existingSuperAdmin = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingSuperAdmin) {
      this.logger.log('SUPER_ADMIN already exists, bootstrap skipped');
      return;
    }

    const superAdmin = this.usersRepository.create({
      tenantId: tenant.id,
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    });

    await this.usersRepository.save(superAdmin);
    this.logger.log(`SUPER_ADMIN created from bootstrap: ${email}`);
  }
}
