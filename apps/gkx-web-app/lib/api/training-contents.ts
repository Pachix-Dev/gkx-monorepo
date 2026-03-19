import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type TrainingContentStatus = "ACTIVE" | "INACTIVE";

export type TrainingContentEntity = {
  id: string;
  tenantId: string;
  trainingLineId: string;
  name: string;
  description?: string | null;
  objective?: string | null;
  level?: string | null;
  estimatedDurationMinutes?: number | null;
  createdBy?: string | null;
  status?: TrainingContentStatus | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TrainingContentsFilters = {
  trainingLineId?: string;
  level?: string;
  search?: string;
};

export type CreateTrainingContentInput = {
  tenantId: string;
  trainingLineId: string;
  name: string;
  description?: string;
  objective?: string;
  level?: string;
  estimatedDurationMinutes?: number;
  status?: TrainingContentStatus;
};

export type UpdateTrainingContentInput = Partial<CreateTrainingContentInput>;

function buildQueryString(filters: TrainingContentsFilters) {
  const params = new URLSearchParams();

  if (filters.trainingLineId) params.set("trainingLineId", filters.trainingLineId);
  if (filters.level) params.set("level", filters.level);
  if (filters.search) params.set("search", filters.search);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getTrainingContents(filters: TrainingContentsFilters = {}) {
  const payload = await apiRequest<unknown>(`/training-contents${buildQueryString(filters)}`, {
    method: "GET",
    auth: true,
  });

  return extractArray<TrainingContentEntity>(payload);
}

export async function createTrainingContent(input: CreateTrainingContentInput) {
  const payload = await apiRequest<unknown>("/training-contents", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<TrainingContentEntity>(payload);
}

export async function updateTrainingContent(id: string, input: UpdateTrainingContentInput) {
  const payload = await apiRequest<unknown>(`/training-contents/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<TrainingContentEntity>(payload);
}

export async function deleteTrainingContent(id: string) {
  await apiRequest<unknown>(`/training-contents/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
