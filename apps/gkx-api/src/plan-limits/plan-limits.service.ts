import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TeamEntity } from '../teams/team.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { UserEntity } from '../users/user.entity';
import { PLAN_LIMITS, PlanLimitResource } from './plan-limits.config';

export interface TenantPlanUsageSnapshot {
  tenantId: string;
  plan: TenantEntity['plan'];
  limits: {
    goalkeepers: number | null;
    teams: number | null;
    users: number | null;
    sessionsPerMonth: number | null;
  };
  usage: {
    goalkeepers: number;
    teams: number;
    users: number;
    sessionsPerMonth: number;
  };
}

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async assertWithinLimit(
    tenantId: string,
    resource: PlanLimitResource,
  ): Promise<void> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const limit = PLAN_LIMITS[tenant.plan][resource];
    if (limit === Infinity) return;

    const current = await this.countResource(resource, tenantId);
    if (current >= limit) {
      throw new ForbiddenException(
        `Plan limit reached: your ${tenant.plan} plan allows up to ${limit} ${resource}. Upgrade to continue.`,
      );
    }
  }

  async getUsage(actor: AuthenticatedUser) {
    return this.getUsageByTenantId(actor.tenantId);
  }

  async getUsageByTenantId(tenantId: string): Promise<TenantPlanUsageSnapshot> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const limits = PLAN_LIMITS[tenant.plan];
    const [goalkeepers, teams, users, sessionsPerMonth] = await Promise.all([
      this.goalkeepersRepository.count({ where: { tenantId } }),
      this.teamsRepository.count({ where: { tenantId } }),
      this.usersRepository.count({ where: { tenantId } }),
      this.countResource('sessionsPerMonth', tenantId),
    ]);

    const toLimit = (v: number) => (v === Infinity ? null : v);

    return {
      tenantId,
      plan: tenant.plan,
      limits: {
        goalkeepers: toLimit(limits.goalkeepers),
        teams: toLimit(limits.teams),
        users: toLimit(limits.users),
        sessionsPerMonth: toLimit(limits.sessionsPerMonth),
      },
      usage: { goalkeepers, teams, users, sessionsPerMonth },
    };
  }

  private async countResource(
    resource: PlanLimitResource,
    tenantId: string,
  ): Promise<number> {
    switch (resource) {
      case 'goalkeepers':
        return this.goalkeepersRepository.count({ where: { tenantId } });
      case 'teams':
        return this.teamsRepository.count({ where: { tenantId } });
      case 'users':
        return this.usersRepository.count({ where: { tenantId } });
      case 'sessionsPerMonth': {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        return this.sessionsRepository.count({
          where: { tenantId, createdAt: Between(start, end) },
        });
      }
      default:
        return 0;
    }
  }
}
