import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type CoachEntity = {
  id: string;
  tenantId: string;
  userId: string;
  specialty?: string | null;
  licenseLevel?: string | null;
  experienceYears?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCoachInput = {
  tenantId: string;
  userId: string;
  specialty?: string;
  licenseLevel?: string;
  experienceYears?: number;
};

export type UpdateCoachInput = Partial<CreateCoachInput>;

export async function getCoaches() {
  const payload = await apiRequest<unknown>("/coaches", {
    method: "GET",
    auth: true,
  });

  return extractArray<CoachEntity>(payload);
}

export async function createCoach(input: CreateCoachInput) {
  const payload = await apiRequest<unknown>("/coaches", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<CoachEntity>(payload);
}

export async function updateCoach(id: string, input: UpdateCoachInput) {
  const payload = await apiRequest<unknown>(`/coaches/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<CoachEntity>(payload);
}

export async function deleteCoach(id: string) {
  await apiRequest<unknown>(`/coaches/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
