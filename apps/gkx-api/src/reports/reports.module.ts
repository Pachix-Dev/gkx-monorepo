import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from '../attendance/attendance.entity';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TeamEntity } from '../teams/team.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoalkeeperEntity,
      TeamEntity,
      TrainingSessionEntity,
      AttendanceEntity,
      EvaluationEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
