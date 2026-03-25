"use client";

import { useMutation } from "@tanstack/react-query";
import {
  downloadGoalkeeperReport,
  downloadSessionReport,
  downloadTeamReport,
  triggerBlobDownload,
} from "@/lib/api/reports";

export function useGoalkeeperReportMutation() {
  return useMutation({
    mutationFn: async (input: {
      goalkeeperId: string;
      from?: string;
      to?: string;
    }) => {
      const blob = await downloadGoalkeeperReport(
        input.goalkeeperId,
        input.from,
        input.to,
      );
      triggerBlobDownload(blob, `goalkeeper-${input.goalkeeperId}-report.pdf`);
    },
  });
}

export function useTeamReportMutation() {
  return useMutation({
    mutationFn: async (input: {
      teamId: string;
      from?: string;
      to?: string;
    }) => {
      const blob = await downloadTeamReport(input.teamId, input.from, input.to);
      triggerBlobDownload(blob, `team-${input.teamId}-report.pdf`);
    },
  });
}

export function useSessionReportMutation() {
  return useMutation({
    mutationFn: async (input: { sessionId: string }) => {
      const blob = await downloadSessionReport(input.sessionId);
      triggerBlobDownload(blob, `session-${input.sessionId}-report.pdf`);
    },
  });
}
