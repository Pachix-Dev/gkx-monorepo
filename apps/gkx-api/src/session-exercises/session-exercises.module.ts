import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseEntity } from '../exercises/exercise.entity';
import { SessionContentEntity } from '../session-contents/session-content.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { SessionExerciseEntity } from './session-exercise.entity';
import { SessionExercisesController } from './session-exercises.controller';
import { SessionExercisesNestedController } from './session-exercises-nested.controller';
import { SessionExercisesService } from './session-exercises.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionExerciseEntity,
      TenantEntity,
      TrainingSessionEntity,
      SessionContentEntity,
      ExerciseEntity,
    ]),
  ],
  controllers: [SessionExercisesController, SessionExercisesNestedController],
  providers: [SessionExercisesService],
  exports: [SessionExercisesService, TypeOrmModule],
})
export class SessionExercisesModule {}
