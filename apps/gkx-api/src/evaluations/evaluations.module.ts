import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { EvaluationEntity } from './evaluation.entity';
import { EvaluationItemEntity } from './evaluation-item.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationEntity,
      EvaluationItemEntity,
      TenantEntity,
      GoalkeeperEntity,
      TrainingSessionEntity,
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService, TypeOrmModule],
})
export class EvaluationsModule {}
