"use client";

import {
  getTacticalDesign,
  updateTacticalDesign,
  UpdateTacticalDesignInput,  
} from "@/lib/api/exercises-tactical";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTacticalDesignQuery(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["exercises", exerciseId, "tactical"],
    queryFn: () => getTacticalDesign(exerciseId!),
    enabled: Boolean(exerciseId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateTacticalDesignMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      exerciseId,
      payload,
    }: {
      exerciseId: string;
      payload: UpdateTacticalDesignInput;
    }) => updateTacticalDesign(exerciseId, payload),
    onSuccess: (data, variables) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        ["exercises", variables.exerciseId, "tactical"],
        data
      );
    },
  });
}
