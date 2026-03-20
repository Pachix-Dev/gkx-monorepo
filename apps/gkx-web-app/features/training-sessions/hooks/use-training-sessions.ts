"use client";

import {
  createTrainingSession,
  CreateTrainingSessionInput,
  deleteTrainingSession,
  getTrainingSession,
  getTrainingSessions,
  updateTrainingSession,
  UpdateTrainingSessionInput,
} from "@/lib/api/training-sessions";
import {
  createSessionTask,
  CreateSessionTaskInput,
  deleteSessionTask,
  getSessionTasks,
  updateSessionTask,
  UpdateSessionTaskInput,
} from "@/lib/api/session-contents";
import {
  createSessionExercise,
  CreateSessionExerciseInput,
  deleteSessionExercise,
  getSessionExercises,
} from "@/lib/api/session-exercises";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTrainingSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.trainingSessions,
    queryFn: getTrainingSessions,
  });
}

export function useTrainingSessionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.trainingSession(id),
    queryFn: () => getTrainingSession(id),
    enabled: Boolean(id),
  });
}

export function useSessionTasksQuery(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.sessionContents(sessionId ?? undefined),
    queryFn: () => getSessionTasks(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useSessionExercisesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.sessionExercises(sessionId ?? undefined),
    queryFn: () => getSessionExercises(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useCreateTrainingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTrainingSessionInput) => createTrainingSession(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions });
    },
  });
}

export function useUpdateTrainingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrainingSessionInput }) => updateTrainingSession(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions });
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingSession(variables.id) });
    },
  });
}

export function useDeleteTrainingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrainingSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.trainingSessions });
    },
  });
}

export function useCreateSessionTaskMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionTaskInput) => createSessionTask(sessionId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionContents(sessionId ?? undefined) });
    },
  });
}

export function useUpdateSessionTaskMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateSessionTaskInput }) =>
      updateSessionTask(sessionId as string, taskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionContents(sessionId ?? undefined) });
    },
  });
}

export function useDeleteSessionTaskMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteSessionTask(sessionId as string, taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionContents(sessionId ?? undefined) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionExercises(sessionId ?? undefined) });
    },
  });
}

export function useCreateSessionExerciseMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionExerciseInput) => createSessionExercise(sessionId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionExercises(sessionId ?? undefined) });
    },
  });
}

export function useDeleteSessionExerciseMutation(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionExerciseId: string) => deleteSessionExercise(sessionId as string, sessionExerciseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessionExercises(sessionId ?? undefined) });
    },
  });
}
