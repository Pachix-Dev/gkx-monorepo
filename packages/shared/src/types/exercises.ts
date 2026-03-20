import { ExerciseStatus } from '../enums/exercise.enum';

export type ExerciseEntity = {
  id: string;
  tenantId: string;
  trainingContentId: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  objective?: string | null;
  durationMinutes?: number | null;
  repetitions?: number | null;
  restSeconds?: number | null;
  equipment?: string | null;
  videoUrl?: string | null;
  difficulty?: string | null;
  order?: number | null;
  status?: ExerciseStatus | null;
  // Tactical fields
  tacticalState?: Record<string, unknown> | null; // JSON stored in DB
  tacticalStateVersion?: number | null;
  tacticalPreviewUrl?: string | null;
  tacticalUpdatedAt?: string | null;
  tacticalHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ExercisesFilters = {
  trainingContentId?: string;
  difficulty?: string;
  search?: string;
};

export type CreateExerciseInput = {
  tenantId: string;
  trainingContentId: string;
  name: string;
  description?: string;
  instructions?: string;
  objective?: string;
  durationMinutes?: number;
  repetitions?: number;
  restSeconds?: number;
  equipment?: string;
  videoUrl?: string;
  difficulty?: string;
  order?: number;
  status?: ExerciseStatus;
};

export type UpdateExerciseInput = Partial<CreateExerciseInput>;
