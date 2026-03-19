import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachEntity } from '../coaches/coach.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TeamEntity } from '../teams/team.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingSessionsController } from './training-sessions.controller';
import { TrainingSessionsService } from './training-sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingSessionEntity,
      TenantEntity,
      CoachEntity,
      TeamEntity,
    ]),
  ],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService],
  exports: [TrainingSessionsService, TypeOrmModule],
})
export class TrainingSessionsModule {}
