import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type TrainingSessionStatus = "DRAFT" | "PLANNED" | "COMPLETED" | "CANCELLED";

export type TrainingSessionEntity = {
  id: string;
  tenantId: string;
  createdByUserId: string;
  title: string;
  trainingContentIds: string[];
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  teamId?: string | null;
  location?: string | null;
  notes?: string | null;
  status?: TrainingSessionStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTrainingSessionInput = {
  tenantId: string;
  title: string;
  trainingContentIds: string[];
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  teamId?: string;
  location?: string;
  notes?: string;
  status?: TrainingSessionStatus;
};

export type UpdateTrainingSessionInput = Partial<CreateTrainingSessionInput>;

export async function getTrainingSessions() {
  const payload = await apiRequest<unknown>("/training-sessions", {
    method: "GET",
    auth: true,
  });

  return extractArray<TrainingSessionEntity>(payload);
}

export async function createTrainingSession(input: CreateTrainingSessionInput) {
  const payload = await apiRequest<unknown>("/training-sessions", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<TrainingSessionEntity>(payload);
}

export async function updateTrainingSession(id: string, input: UpdateTrainingSessionInput) {
  const payload = await apiRequest<unknown>(`/training-sessions/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<TrainingSessionEntity>(payload);
}

export async function deleteTrainingSession(id: string) {
  await apiRequest<unknown>(`/training-sessions/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getTrainingSession(id: string) {
  const payload = await apiRequest<unknown>(`/training-sessions/${id}`, {
    method: "GET",
    auth: true,
  });

  return extractData<TrainingSessionEntity>(payload);
}
