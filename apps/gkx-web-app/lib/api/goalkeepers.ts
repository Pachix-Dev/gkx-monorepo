import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type GoalkeeperEntity = {
  id: string;
  tenantId: string;
  userId: string;
  dateOfBirth?: string | null;
  dominantHand?: string | null;
  dominantFoot?: string | null;
  height?: number | null;
  weight?: number | null;
  category?: string | null;
  teamId?: string | null;
  medicalNotes?: string | null;
  parentContact?: string | null;
  createdAt?: string;
};

export type CreateGoalkeeperInput = {
  tenantId: string;
  userId: string;
  dateOfBirth?: string;
  dominantHand?: string;
  dominantFoot?: string;
  height?: number;
  weight?: number;
  category?: string;
  teamId?: string;
  medicalNotes?: string;
  parentContact?: string;
};

export type UpdateGoalkeeperInput = Partial<CreateGoalkeeperInput>;

export async function getGoalkeepers() {
  const payload = await apiRequest<unknown>("/goalkeepers", {
    method: "GET",
    auth: true,
  });

  return extractArray<GoalkeeperEntity>(payload);
}

export async function createGoalkeeper(input: CreateGoalkeeperInput) {
  const payload = await apiRequest<unknown>("/goalkeepers", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<GoalkeeperEntity>(payload);
}

export async function updateGoalkeeper(id: string, input: UpdateGoalkeeperInput) {
  const payload = await apiRequest<unknown>(`/goalkeepers/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<GoalkeeperEntity>(payload);
}

export async function deleteGoalkeeper(id: string) {
  await apiRequest<unknown>(`/goalkeepers/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
