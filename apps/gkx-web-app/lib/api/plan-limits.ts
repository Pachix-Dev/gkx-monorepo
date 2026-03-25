import { apiRequest } from "@/lib/api/client";
import { extractData } from "@/lib/api/response";

export type PlanUsagePayload = {
  plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
  limits: {
    goalkeepers: number | null;
    teams: number | null;
    users: number | null;
    sessionsPerMonth: number | null;
  };
  usage: {
    goalkeepers: number;
    teams: number;
    users: number;
    sessionsPerMonth: number;
  };
};

export async function getPlanUsage(): Promise<PlanUsagePayload> {
  const payload = await apiRequest<unknown>("/plan-limits/usage", {
    method: "GET",
    auth: true,
  });

  return extractData<PlanUsagePayload>(payload);
}
