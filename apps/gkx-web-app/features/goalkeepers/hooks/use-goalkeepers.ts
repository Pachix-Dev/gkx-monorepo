"use client";

import {
  createGoalkeeper,
  CreateGoalkeeperInput,
  deleteGoalkeeper,
  getGoalkeepers,
  updateGoalkeeper,
  UpdateGoalkeeperInput,
} from "@/lib/api/goalkeepers";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGoalkeepersQuery() {
  return useQuery({
    queryKey: queryKeys.goalkeepers,
    queryFn: getGoalkeepers,
  });
}

export function useCreateGoalkeeperMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGoalkeeperInput) => createGoalkeeper(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goalkeepers });
    },
  });
}

export function useUpdateGoalkeeperMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalkeeperInput }) => updateGoalkeeper(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goalkeepers });
    },
  });
}

export function useDeleteGoalkeeperMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGoalkeeper(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goalkeepers });
    },
  });
}
