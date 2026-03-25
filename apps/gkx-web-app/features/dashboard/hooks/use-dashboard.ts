"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardAlerts,
  getDashboardKpis,
  getDashboardTrends,
  getSystemHealth,
} from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query/keys";

export function useDashboardKpisQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardKpis,
    queryFn: getDashboardKpis,
  });
}

export function useDashboardTrendsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardTrends,
    queryFn: getDashboardTrends,
  });
}

export function useDashboardHealthQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardHealth,
    queryFn: getSystemHealth,
  });
}

export function useDashboardAlertsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardAlerts,
    queryFn: getDashboardAlerts,
  });
}
