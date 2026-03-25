import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseEntity } from '../exercises/exercise.entity';
import { PlanLimitsModule } from '../plan-limits/plan-limits.module';
import { SessionContentEntity } from '../session-contents/session-content.entity';
import { SessionExerciseEntity } from '../session-exercises/session-exercise.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TeamEntity } from '../teams/team.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingSessionsController } from './training-sessions.controller';
import { TrainingSessionsService } from './training-sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingSessionEntity,
      TenantEntity,
      TeamEntity,
      SessionContentEntity,
      SessionExerciseEntity,
      ExerciseEntity,
      TrainingContentEntity,
    ]),
    PlanLimitsModule,
  ],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService],
  exports: [TrainingSessionsService, TypeOrmModule],
})
export class TrainingSessionsModule {}
