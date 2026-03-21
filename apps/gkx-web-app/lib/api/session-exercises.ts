import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type SessionExerciseEntity = {
  id: string;
  tenantId: string;
  sessionId: string;
  sessionContentId: string;
  exerciseId: string;
  selected: boolean;
  tacticalPreviewUrlSnapshot?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSessionExerciseInput = {
  tenantId: string;
  sessionId: string;
  sessionContentId: string;
  exerciseId: string;
  selected?: boolean;
};

export type UpdateSessionExerciseInput = Partial<CreateSessionExerciseInput>;

export async function getSessionExercises(sessionId: string) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/exercises`, {
    method: "GET",
    auth: true,
  });

  return extractArray<SessionExerciseEntity>(payload);
}

export async function createSessionExercise(sessionId: string, input: CreateSessionExerciseInput) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/exercises`, {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<SessionExerciseEntity>(payload);
}

export async function updateSessionExercise(sessionId: string, sessionExerciseId: string, input: UpdateSessionExerciseInput) {
  const payload = await apiRequest<unknown>(`/training-sessions/${sessionId}/exercises/${sessionExerciseId}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<SessionExerciseEntity>(payload);
}

export async function deleteSessionExercise(sessionId: string, sessionExerciseId: string) {
  await apiRequest<unknown>(`/training-sessions/${sessionId}/exercises/${sessionExerciseId}`, {
    method: "DELETE",
    auth: true,
  });
}
