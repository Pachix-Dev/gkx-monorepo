"use client";

import {
  assignGoalkeeperToTeam,
  createTeam,
  CreateTeamInput,
  deleteTeam,
  getTeams,
  updateTeam,
  UpdateTeamInput,
} from "@/lib/api/teams";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTeamsQuery() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeamInput) => createTeam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamInput }) => updateTeam(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

export function useAssignGoalkeeperMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, goalkeeperId }: { teamId: string; goalkeeperId: string }) => assignGoalkeeperToTeam(teamId, goalkeeperId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}
