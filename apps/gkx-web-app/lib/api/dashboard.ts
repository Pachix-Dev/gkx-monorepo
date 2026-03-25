import { apiRequest } from "@/lib/api/client";
import { extractData } from "@/lib/api/response";

export type DashboardKpis = {
  totalGoalkeepers: number;
  totalTeams: number;
  totalSessions: number;
  sessionsThisMonth: number;
  evaluationsThisMonth: number;
  attendanceRatePercent: number;
  avgOverallScore: number | null;
  activeUsers: number;
  updatedAt: string;
};

export type DashboardTrends = {
  sessionsPerWeek: { week: string; count: number }[];
  attendancePerWeek: { week: string; rate: number }[];
  avgScorePerGoalkeeper: {
    goalkeeperId: string;
    avg: number;
    evaluationsCount: number;
  }[];
};

export type DashboardAlert = {
  tenantId: string;
  tenantName: string;
  resource: "goalkeepers" | "teams" | "users" | "sessionsPerMonth";
  usage: number;
  limit: number;
  percent: number;
  severity: "warning" | "critical";
  message: string;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const payload = await apiRequest<unknown>("/dashboard/kpis", {
    method: "GET",
    auth: true,
  });
  return extractData<DashboardKpis>(payload);
}

export async function getDashboardTrends(): Promise<DashboardTrends> {
  const payload = await apiRequest<unknown>("/dashboard/trends", {
    method: "GET",
    auth: true,
  });
  return extractData<DashboardTrends>(payload);
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const payload = await apiRequest<unknown>("/dashboard/alerts", {
    method: "GET",
    auth: true,
  });

  return extractData<DashboardAlert[]>(payload) ?? [];
}

export async function getSystemHealth() {
  const payload = await apiRequest<unknown>("/health", {
    method: "GET",
    auth: true,
  });

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    if (typeof source.message === "string")
      return { ok: true, label: source.message };
    if (typeof source.status === "string")
      return { ok: true, label: source.status };
  }

  return { ok: true, label: "healthy" };
}
