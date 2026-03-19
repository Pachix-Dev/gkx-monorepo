"use client";

import {
  createTrainingContent,
  CreateTrainingContentInput,
  deleteTrainingContent,
  getTrainingContents,
  TrainingContentsFilters,
  updateTrainingContent,
  UpdateTrainingContentInput,
} from "@/lib/api/training-contents";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTrainingContentsQuery(filters: TrainingContentsFilters) {
  return useQuery({
    queryKey: queryKeys.trainingContents(filters),
    queryFn: () => getTrainingContents(filters),
  });
}

export function useCreateTrainingContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTrainingContentInput) => createTrainingContent(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["training-contents"] });
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

export function useUpdateTrainingContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrainingContentInput }) => updateTrainingContent(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["training-contents"] });
    },
  });
}

export function useDeleteTrainingContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrainingContent(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["training-contents"] });
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
