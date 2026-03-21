import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

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
};

export type UpdateExerciseInput = Partial<CreateExerciseInput>;

function buildQueryString(filters: ExercisesFilters) {
  const params = new URLSearchParams();

  if (filters.trainingContentId) params.set("trainingContentId", filters.trainingContentId);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.search) params.set("search", filters.search);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getExercises(filters: ExercisesFilters = {}) {
  const payload = await apiRequest<unknown>(`/exercises${buildQueryString(filters)}`, {
    method: "GET",
    auth: true,
  });

  return extractArray<ExerciseEntity>(payload);
}

export async function getExercise(id: string) {
  const payload = await apiRequest<unknown>(`/exercises/${id}`, {
    method: "GET",
    auth: true,
  });

  return extractData<ExerciseEntity>(payload);
}

export async function createExercise(input: CreateExerciseInput) {
  const payload = await apiRequest<unknown>("/exercises", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<ExerciseEntity>(payload);
}

export async function updateExercise(id: string, input: UpdateExerciseInput) {
  const payload = await apiRequest<unknown>(`/exercises/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<ExerciseEntity>(payload);
}

export async function deleteExercise(id: string) {
  await apiRequest<unknown>(`/exercises/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
