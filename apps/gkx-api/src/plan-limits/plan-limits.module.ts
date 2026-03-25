import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TeamEntity } from '../teams/team.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { UserEntity } from '../users/user.entity';
import { PlanLimitsController } from './plan-limits.controller';
import { PlanLimitsService } from './plan-limits.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      GoalkeeperEntity,
      TeamEntity,
      TrainingSessionEntity,
      UserEntity,
    ]),
  ],
  controllers: [PlanLimitsController],
  providers: [PlanLimitsService],
  exports: [PlanLimitsService],
})
export class PlanLimitsModule {}
