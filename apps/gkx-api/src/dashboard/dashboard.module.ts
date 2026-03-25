import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from '../attendance/attendance.entity';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { PlanLimitsModule } from '../plan-limits/plan-limits.module';
import { TeamEntity } from '../teams/team.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { UserEntity } from '../users/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoalkeeperEntity,
      TeamEntity,
      TrainingSessionEntity,
      AttendanceEntity,
      EvaluationEntity,
      UserEntity,
      TenantEntity,
    ]),
    PlanLimitsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
