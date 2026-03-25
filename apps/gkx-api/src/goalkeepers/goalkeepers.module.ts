import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { PlanLimitsModule } from '../plan-limits/plan-limits.module';
import { TenantEntity } from '../tenants/tenant.entity';
import { GoalkeeperEntity } from './goalkeeper.entity';
import { GoalkeepersController } from './goalkeepers.controller';
import { GoalkeepersService } from './goalkeepers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoalkeeperEntity,
      TenantEntity,
      EvaluationEntity,
    ]),
    PlanLimitsModule,
  ],
  controllers: [GoalkeepersController],
  providers: [GoalkeepersService],
  exports: [GoalkeepersService, TypeOrmModule],
})
export class GoalkeepersModule {}
