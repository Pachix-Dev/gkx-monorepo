import { ApiProperty } from '@nestjs/swagger';

export class PublicTenantModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  plan!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class PublicUserModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class AuthTokensModel {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthLoginDataModel extends AuthTokensModel {
  @ApiProperty({ type: PublicUserModel })
  user!: PublicUserModel;

  @ApiProperty({ type: PublicTenantModel, nullable: true })
  tenant!: PublicTenantModel | null;
}

export class AuthRegisterDataModel {
  @ApiProperty({ type: PublicUserModel })
  user!: PublicUserModel;

  @ApiProperty({ type: PublicTenantModel })
  tenant!: PublicTenantModel;

  @ApiProperty({ example: true })
  verificationRequired!: boolean;
}

export class AuthMeDataModel {
  @ApiProperty({ type: PublicUserModel })
  user!: PublicUserModel;

  @ApiProperty({ type: PublicTenantModel, nullable: true })
  tenant!: PublicTenantModel | null;
}

export class LogoutDataModel {
  @ApiProperty()
  revoked!: boolean;
}

export class AuthActionEmailDispatchedModel {
  @ApiProperty({ example: true })
  sent!: boolean;
}

export class AuthVerificationStatusModel {
  @ApiProperty({ example: true })
  verified!: boolean;
}

export class AuthPasswordResetStatusModel {
  @ApiProperty({ example: true })
  reset!: boolean;
}

export class DeleteDataModel {
  @ApiProperty()
  deleted!: boolean;
}

export class TeamModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  category!: string | null;

  @ApiProperty({ nullable: true })
  season!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  coachId!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
export class GoalkeeperModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true })
  dateOfBirth!: string | null;

  @ApiProperty({ nullable: true })
  dominantHand!: string | null;

  @ApiProperty({ nullable: true })
  dominantFoot!: string | null;

  @ApiProperty({ nullable: true })
  height!: number | null;

  @ApiProperty({ nullable: true })
  weight!: number | null;

  @ApiProperty({ nullable: true })
  category!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  teamId!: string | null;

  @ApiProperty({ nullable: true })
  medicalNotes!: string | null;

  @ApiProperty({ nullable: true })
  parentContact!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class GoalkeeperProgressModel {
  @ApiProperty()
  evaluationsCount!: number;

  @ApiProperty({ nullable: true })
  averageOverallScore!: number | null;

  @ApiProperty({ nullable: true })
  latestEvaluationDate!: string | null;

  @ApiProperty({ nullable: true })
  latestOverallScore!: number | null;
}

export class GoalkeeperMetricsModel {
  @ApiProperty({ format: 'uuid' })
  goalkeeperId!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  records!: Record<string, unknown>[];
}

export class TrainingLineModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class TrainingContentModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  trainingLineId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  createdBy!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class ExerciseModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  trainingContentId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  instructions!: string | null;

  @ApiProperty({ nullable: true })
  objective!: string | null;

  @ApiProperty({ nullable: true })
  durationMinutes!: number | null;

  @ApiProperty({ nullable: true })
  repetitions!: number | null;

  @ApiProperty({ nullable: true })
  restSeconds!: number | null;

  @ApiProperty({ nullable: true })
  equipment!: string | null;

  @ApiProperty({ nullable: true })
  videoUrl!: string | null;

  @ApiProperty({ nullable: true })
  difficulty!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class TrainingSessionModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  createdByUserId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  trainingContentIds!: string[];

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty({ format: 'date-time' })
  startTime!: Date;

  @ApiProperty({ format: 'date-time' })
  endTime!: Date;

  @ApiProperty({ format: 'uuid', nullable: true })
  teamId!: string | null;

  @ApiProperty({ nullable: true })
  location!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class SessionContentModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  trainingContentId!: string | null;

  @ApiProperty()
  taskName!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ nullable: true })
  customDurationMinutes!: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class SessionExerciseModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty({ format: 'uuid' })
  sessionContentId!: string;

  @ApiProperty({ format: 'uuid' })
  exerciseId!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  selected!: boolean;

  @ApiProperty({ nullable: true })
  customDurationMinutes!: number | null;

  @ApiProperty({ nullable: true })
  customRepetitions!: number | null;

  @ApiProperty({ nullable: true })
  customRestSeconds!: number | null;

  @ApiProperty({ nullable: true })
  coachNotes!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class AttendanceModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  trainingSessionId!: string;

  @ApiProperty({ format: 'uuid' })
  goalkeeperId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  recordedByUserId!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  recordedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class EvaluationModel {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  goalkeeperId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  trainingSessionId!: string | null;

  @ApiProperty({ format: 'uuid' })
  evaluatedByUserId!: string;

  @ApiProperty({ format: 'date' })
  evaluationDate!: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        evaluationId: { type: 'string', format: 'uuid' },
        criterionCode: { type: 'string' },
        criterionLabel: { type: 'string' },
        score: { type: 'number' },
        comment: { type: 'string', nullable: true },
      },
    },
  })
  items!: Array<{
    id: string;
    evaluationId: string;
    criterionCode: string;
    criterionLabel: string;
    score: number;
    comment: string | null;
  }>;

  @ApiProperty()
  overallScore!: number;

  @ApiProperty({ nullable: true })
  generalComment!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
