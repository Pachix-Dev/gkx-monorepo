"use client";

import {
  createTrainingLine,
  CreateTrainingLineInput,
  deleteTrainingLine,
  getTrainingLines,
  updateTrainingLine,
  UpdateTrainingLineInput,
} from "@/lib/api/training-lines";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTrainingLinesQuery() {
  return useQuery({
    queryKey: queryKeys.trainingLines,
    queryFn: getTrainingLines,
  });
}

export function useCreateTrainingLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTrainingLineInput) => createTrainingLine(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingLines });
    },
  });
}

export function useUpdateTrainingLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrainingLineInput }) => updateTrainingLine(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingLines });
    },
  });
}

export function useDeleteTrainingLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrainingLine(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingLines });
      await queryClient.invalidateQueries({ queryKey: ["training-contents"] });
    },
  });
}
