import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type TeamEntity = {
  id: string;
  tenantId: string;
  name: string;
  category?: string | null;
  season?: string | null;
  coachId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTeamInput = {
  tenantId: string;
  name: string;
  category?: string;
  season?: string;
  coachId?: string;
};

export type UpdateTeamInput = Partial<CreateTeamInput>;

export async function getTeams() {
  const payload = await apiRequest<unknown>("/teams", {
    method: "GET",
    auth: true,
  });

  return extractArray<TeamEntity>(payload);
}

export async function createTeam(input: CreateTeamInput) {
  const payload = await apiRequest<unknown>("/teams", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<TeamEntity>(payload);
}

export async function updateTeam(id: string, input: UpdateTeamInput) {
  const payload = await apiRequest<unknown>(`/teams/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<TeamEntity>(payload);
}

export async function deleteTeam(id: string) {
  await apiRequest<unknown>(`/teams/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function assignGoalkeeperToTeam(teamId: string, goalkeeperId: string) {
  const payload = await apiRequest<unknown>(`/teams/${teamId}/goalkeepers/${goalkeeperId}`, {
    method: "POST",
    auth: true,
  });

  return extractData<unknown>(payload);
}
