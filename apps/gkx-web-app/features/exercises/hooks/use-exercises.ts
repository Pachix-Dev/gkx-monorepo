"use client";

import {
  createExercise,
  CreateExerciseInput,
  deleteExercise,
  ExercisesFilters,
  getExercise,
  getExercises,
  updateExercise,
  UpdateExerciseInput,
} from "@/lib/api/exercises";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useExerciseQuery(id: string) {
  return useQuery({
    queryKey: ["exercises", id],
    queryFn: () => getExercise(id),
    enabled: Boolean(id),
  });
}

export function useExercisesQuery(filters: ExercisesFilters) {
  return useQuery({
    queryKey: queryKeys.exercises(filters),
    queryFn: () => getExercises(filters),
  });
}

export function useCreateExerciseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExerciseInput) => createExercise(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

export function useUpdateExerciseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExerciseInput }) => updateExercise(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

export function useDeleteExerciseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
