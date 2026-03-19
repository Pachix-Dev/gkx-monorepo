import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type TrainingLineStatus = "ACTIVE" | "INACTIVE";

export type TrainingLineEntity = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  order?: number | null;
  status?: TrainingLineStatus | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTrainingLineInput = {
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  status?: TrainingLineStatus;
};

export type UpdateTrainingLineInput = Partial<CreateTrainingLineInput>;

export async function getTrainingLines() {
  const payload = await apiRequest<unknown>("/training-lines", {
    method: "GET",
    auth: true,
  });

  return extractArray<TrainingLineEntity>(payload);
}

export async function createTrainingLine(input: CreateTrainingLineInput) {
  const payload = await apiRequest<unknown>("/training-lines", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<TrainingLineEntity>(payload);
}

export async function updateTrainingLine(id: string, input: UpdateTrainingLineInput) {
  const payload = await apiRequest<unknown>(`/training-lines/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<TrainingLineEntity>(payload);
}

export async function deleteTrainingLine(id: string) {
  await apiRequest<unknown>(`/training-lines/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
