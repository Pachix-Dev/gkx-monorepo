import { TacticalDesignState } from './tactical';

export type SessionExerciseEntity = {
  id: string;
  tenantId: string;
  sessionId: string;
  sessionContentId: string;
  exerciseId: string;
  order?: number | null;
  selected?: boolean | null;
  customDurationMinutes?: number | null;
  customRepetitions?: number | null;
  customRestSeconds?: number | null;
  coachNotes?: string | null;
  // Tactical snapshot fields
  tacticalStateSnapshot?: TacticalDesignState | null;
  tacticalPreviewUrlSnapshot?: string | null;
  tacticalSnapshotCreatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
