"use client";

import { createCoach, CreateCoachInput, deleteCoach, getCoaches, updateCoach, UpdateCoachInput } from "@/lib/api/coaches";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCoachesQuery() {
  return useQuery({
    queryKey: queryKeys.coaches,
    queryFn: getCoaches,
  });
}

export function useCreateCoachMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoachInput) => createCoach(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coaches });
    },
  });
}

export function useUpdateCoachMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCoachInput }) => updateCoach(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coaches });
    },
  });
}

export function useDeleteCoachMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCoach(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coaches });
    },
  });
}
