import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AttendanceEntity,
  AttendanceStatus,
} from '../attendance/attendance.entity';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import {
  PlanLimitsService,
  TenantPlanUsageSnapshot,
} from '../plan-limits/plan-limits.service';
import { TeamEntity } from '../teams/team.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { UserEntity, UserStatus } from '../users/user.entity';

type DashboardAlertSeverity = 'warning' | 'critical';

type DashboardAlert = {
  tenantId: string;
  tenantName: string;
  resource: keyof TenantPlanUsageSnapshot['usage'];
  usage: number;
  limit: number;
  percent: number;
  severity: DashboardAlertSeverity;
  message: string;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async getKpis(actor: AuthenticatedUser) {
    const tenantId =
      actor.role === Role.SUPER_ADMIN ? undefined : actor.tenantId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const where = tenantId ? { tenantId } : {};

    const [
      totalGoalkeepers,
      totalTeams,
      totalSessions,
      sessionsThisMonth,
      evaluationsThisMonth,
      totalAttendance,
      presentAttendance,
      activeUsers,
    ] = await Promise.all([
      this.goalkeepersRepository.count({ where }),
      this.teamsRepository.count({ where }),
      this.sessionsRepository.count({ where }),
      this.sessionsRepository.count({
        where: tenantId
          ? { tenantId, createdAt: Between(monthStart, monthEnd) }
          : { createdAt: Between(monthStart, monthEnd) },
      }),
      this.evaluationsRepository.count({
        where: tenantId
          ? { tenantId, createdAt: Between(monthStart, monthEnd) }
          : { createdAt: Between(monthStart, monthEnd) },
      }),
      this.attendanceRepository.count({ where }),
      this.attendanceRepository.count({
        where: tenantId
          ? { tenantId, status: AttendanceStatus.PRESENT }
          : { status: AttendanceStatus.PRESENT },
      }),
      this.usersRepository.count({
        where: tenantId
          ? { tenantId, status: UserStatus.ACTIVE }
          : { status: UserStatus.ACTIVE },
      }),
    ]);

    const avgScoreRaw = await this.evaluationsRepository
      .createQueryBuilder('e')
      .select('AVG(e.overallScore)', 'avg')
      .where(tenantId ? 'e.tenantId = :tenantId' : '1=1', { tenantId })
      .andWhere('e.createdAt BETWEEN :start AND :end', {
        start: monthStart,
        end: monthEnd,
      })
      .getRawOne<{ avg: string | null }>();

    const attendanceRatePercent =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

    const avgOverallScore =
      avgScoreRaw?.avg != null
        ? Math.round(parseFloat(avgScoreRaw.avg) * 10) / 10
        : null;

    return {
      totalGoalkeepers,
      totalTeams,
      totalSessions,
      sessionsThisMonth,
      evaluationsThisMonth,
      attendanceRatePercent,
      avgOverallScore,
      activeUsers,
      updatedAt: now.toISOString(),
    };
  }

  async getTrends(actor: AuthenticatedUser) {
    const tenantId =
      actor.role === Role.SUPER_ADMIN ? undefined : actor.tenantId;
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 56); // 8 weeks

    const sessionsPerWeek = await this.sessionsRepository
      .createQueryBuilder('s')
      .select("TO_CHAR(DATE_TRUNC('week', s.createdAt), 'YYYY-MM-DD')", 'week')
      .addSelect('COUNT(*)', 'count')
      .where(tenantId ? 's.tenantId = :tenantId' : '1=1', { tenantId })
      .andWhere('s.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('week', s.createdAt)")
      .orderBy("DATE_TRUNC('week', s.createdAt)", 'ASC')
      .getRawMany<{ week: string; count: string }>();

    const attendancePerWeek = await this.attendanceRepository
      .createQueryBuilder('a')
      .select("TO_CHAR(DATE_TRUNC('week', a.createdAt), 'YYYY-MM-DD')", 'week')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)",
        'present',
      )
      .where(tenantId ? 'a.tenantId = :tenantId' : '1=1', { tenantId })
      .andWhere('a.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('week', a.createdAt)")
      .orderBy("DATE_TRUNC('week', a.createdAt)", 'ASC')
      .getRawMany<{ week: string; total: string; present: string }>();

    const avgScorePerGoalkeeper = await this.evaluationsRepository
      .createQueryBuilder('e')
      .select('e.goalkeeperId', 'goalkeeperId')
      .addSelect('AVG(e.overallScore)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where(tenantId ? 'e.tenantId = :tenantId' : '1=1', { tenantId })
      .groupBy('e.goalkeeperId')
      .orderBy('AVG(e.overallScore)', 'DESC')
      .limit(10)
      .getRawMany<{ goalkeeperId: string; avg: string; count: string }>();

    return {
      sessionsPerWeek: sessionsPerWeek.map((r) => ({
        week: r.week,
        count: parseInt(r.count, 10),
      })),
      attendancePerWeek: attendancePerWeek.map((r) => {
        const total = parseInt(r.total, 10);
        const present = parseInt(r.present, 10);
        return {
          week: r.week,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      }),
      avgScorePerGoalkeeper: avgScorePerGoalkeeper.map((r) => ({
        goalkeeperId: r.goalkeeperId,
        avg: Math.round(parseFloat(r.avg) * 10) / 10,
        evaluationsCount: parseInt(r.count, 10),
      })),
    };
  }

  async getAlerts(actor: AuthenticatedUser): Promise<DashboardAlert[]> {
    const tenantList =
      actor.role === Role.SUPER_ADMIN
        ? await this.tenantsRepository.find({ order: { createdAt: 'DESC' } })
        : await this.tenantsRepository.find({ where: { id: actor.tenantId } });

    const alerts: DashboardAlert[] = [];

    for (const tenant of tenantList) {
      const usageSnapshot = await this.planLimitsService.getUsageByTenantId(
        tenant.id,
      );
      alerts.push(...this.buildAlertsForTenant(tenant, usageSnapshot));
    }

    return alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1;
      }
      return b.percent - a.percent;
    });
  }

  private buildAlertsForTenant(
    tenant: TenantEntity,
    usageSnapshot: TenantPlanUsageSnapshot,
  ): DashboardAlert[] {
    const resources: Array<keyof TenantPlanUsageSnapshot['usage']> = [
      'goalkeepers',
      'teams',
      'users',
      'sessionsPerMonth',
    ];

    const result: DashboardAlert[] = [];

    for (const resource of resources) {
      const limit = usageSnapshot.limits[resource];
      if (limit == null || limit <= 0) continue;

      const usage = usageSnapshot.usage[resource];
      const percent = Math.round((usage / limit) * 100);

      if (percent < 80) continue;

      const severity: DashboardAlertSeverity =
        percent >= 100 ? 'critical' : 'warning';
      const resourceLabel = this.getResourceLabel(resource);

      result.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        resource,
        usage,
        limit,
        percent,
        severity,
        message:
          severity === 'critical'
            ? `${tenant.name}: limite alcanzado en ${resourceLabel} (${usage}/${limit})`
            : `${tenant.name}: ${resourceLabel} al ${percent}% (${usage}/${limit})`,
      });
    }

    return result;
  }

  private getResourceLabel(resource: keyof TenantPlanUsageSnapshot['usage']) {
    switch (resource) {
      case 'goalkeepers':
        return 'goalkeepers';
      case 'teams':
        return 'teams';
      case 'users':
        return 'users';
      case 'sessionsPerMonth':
        return 'sesiones/mes';
      default:
        return resource;
    }
  }
}
