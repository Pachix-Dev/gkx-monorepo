import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { ExerciseEntity } from './exercise.entity';
import { ExercisesController } from './exercises.controller';
import { ExercisesNestedController } from './exercises-nested.controller';
import { ExercisesTacticalController } from './exercises-tactical.controller';
import { ExercisesService } from './exercises.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExerciseEntity,
      TenantEntity,
      TrainingContentEntity,
    ]),
  ],
  controllers: [
    ExercisesController,
    ExercisesNestedController,
    ExercisesTacticalController,
  ],
  providers: [ExercisesService],
  exports: [ExercisesService, TypeOrmModule],
})
export class ExercisesModule {}
