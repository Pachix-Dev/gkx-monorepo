import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TacticalPreviewStorageService } from '../common/storage/tactical-preview-storage.service';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { ExerciseEntity } from './exercise.entity';
import { ExercisesController } from './exercises.controller';
import { ExercisesNestedController } from './exercises-nested.controller';
import { ExercisesTacticalController } from './exercises-tactical.controller';
import { TacticalPlayGeneratorAiStudioService } from './tactical-play-generator-aistudio.service';
import { ExercisesService } from './exercises.service';
import { TacticalPlayGeneratorOpenRouterService } from './tactical-play-generator-openrouter.service';
import { TacticalPlayGeneratorService } from './tactical-play-generator.service';

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
  providers: [
    ExercisesService,
    TacticalPreviewStorageService,
    TacticalPlayGeneratorService,
    TacticalPlayGeneratorAiStudioService,
    TacticalPlayGeneratorOpenRouterService,
  ],
  exports: [ExercisesService, TypeOrmModule],
})
export class ExercisesModule {}
