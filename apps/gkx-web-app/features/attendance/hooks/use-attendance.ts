"use client";

import {
  createAttendanceBulk,
  CreateAttendanceBulkInput,
  getAttendance,
  getAttendanceBySession,
} from "@/lib/api/attendance";
import { queryKeys } from "@/lib/query/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAttendanceQuery() {
  return useQuery({
    queryKey: queryKeys.attendance,
    queryFn: getAttendance,
  });
}

export function useAttendanceBySessionQuery(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.attendanceBySession(sessionId ?? undefined),
    queryFn: () => getAttendanceBySession(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useCreateAttendanceBulkMutation(sessionId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttendanceBulkInput) => createAttendanceBulk(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
      if (sessionId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.attendanceBySession(sessionId),
        });
      }
    },
  });
}
