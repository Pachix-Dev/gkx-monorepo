import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuthSessionEntity } from './auth/entities/auth-session.entity';
import { EmailActionTokenEntity } from './auth/entities/email-action-token.entity';
import { AttendanceEntity } from './attendance/attendance.entity';
import { AttendanceModule } from './attendance/attendance.module';
import { EvaluationEntity } from './evaluations/evaluation.entity';
import { EvaluationItemEntity } from './evaluations/evaluation-item.entity';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlanLimitsModule } from './plan-limits/plan-limits.module';
import { ReportsModule } from './reports/reports.module';
import { PlanChangeRequestEntity } from './subscriptions/plan-change-request.entity';
import { SubscriptionEntity } from './subscriptions/subscription.entity';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { GoalkeeperEntity } from './goalkeepers/goalkeeper.entity';
import { GoalkeepersModule } from './goalkeepers/goalkeepers.module';
import { SessionContentEntity } from './session-contents/session-content.entity';
import { SessionContentsModule } from './session-contents/session-contents.module';
import { SessionExerciseEntity } from './session-exercises/session-exercise.entity';
import { SessionExercisesModule } from './session-exercises/session-exercises.module';
import { TenantEntity } from './tenants/tenant.entity';
import { TenantsModule } from './tenants/tenants.module';
import { TeamEntity } from './teams/team.entity';
import { TeamsModule } from './teams/teams.module';
import { ExerciseEntity } from './exercises/exercise.entity';
import { ExercisesModule } from './exercises/exercises.module';
import { TrainingContentEntity } from './training-contents/training-content.entity';
import { TrainingContentsModule } from './training-contents/training-contents.module';
import { TrainingLineEntity } from './training-lines/training-line.entity';
import { TrainingLinesModule } from './training-lines/training-lines.module';
import { TrainingSessionEntity } from './training-sessions/training-session.entity';
import { TrainingSessionsModule } from './training-sessions/training-sessions.module';
import { UserEntity } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      uuidExtension: 'pgcrypto',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        TenantEntity,
        UserEntity,
        AuthSessionEntity,
        EmailActionTokenEntity,
        GoalkeeperEntity,
        TeamEntity,
        TrainingLineEntity,
        TrainingContentEntity,
        ExerciseEntity,
        TrainingSessionEntity,
        SessionContentEntity,
        SessionExerciseEntity,
        AttendanceEntity,
        EvaluationEntity,
        EvaluationItemEntity,
        SubscriptionEntity,
        PlanChangeRequestEntity,
      ],
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    GoalkeepersModule,
    TeamsModule,
    TrainingLinesModule,
    TrainingContentsModule,
    ExercisesModule,
    TrainingSessionsModule,
    SessionContentsModule,
    SessionExercisesModule,
    AttendanceModule,
    EvaluationsModule,
    PlanLimitsModule,
    SubscriptionsModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
