"use client";

import { getDashboardKpis, getSystemHealth } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query/keys";
import { useQuery } from "@tanstack/react-query";

export function useDashboardKpisQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardKpis,
    queryFn: getDashboardKpis,
  });
}

export function useDashboardHealthQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardHealth,
    queryFn: getSystemHealth,
  });
}
