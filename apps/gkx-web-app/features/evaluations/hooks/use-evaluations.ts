"use client";

import {
  createEvaluation,
  CreateEvaluationInput,
  deleteEvaluation,
  getEvaluations,
  getEvaluationsBySession,
} from "@/lib/api/evaluations";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useEvaluationsQuery() {
  return useQuery({
    queryKey: queryKeys.evaluations,
    queryFn: getEvaluations,
  });
}

export function useEvaluationsBySessionQuery(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.evaluationsBySession(sessionId ?? undefined),
    queryFn: () => getEvaluationsBySession(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useCreateEvaluationMutation(sessionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEvaluationInput) => createEvaluation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.evaluations });
      if (sessionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.evaluationsBySession(sessionId),
        });
      }
    },
  });
}

export function useDeleteEvaluationMutation(sessionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvaluation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.evaluations });
      if (sessionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.evaluationsBySession(sessionId),
        });
      }
    },
  });
}
