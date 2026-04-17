import { DashboardClient } from "@/features/dashboard/components/dashboard-client";
import { extractArray } from "@/lib/api/response";
import { queryKeys } from "@/lib/query/keys";
import { createQueryClient } from "@/lib/query/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

type SessionEntity = {
  date?: string;
  createdAt?: string;
};

type EvaluationEntity = {
  date?: string;
  createdAt?: string;
};

function isDateInCurrentWeek(raw?: string) {
  if (!raw) return false;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < weekEnd;
}

async function fetchAuthed(path: string, token: string | undefined) {
  if (!API_BASE_URL || !token) {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getServerDashboardKpis(token: string | undefined) {
  const [goalkeepersPayload, teamsPayload, sessionsPayload, evaluationsPayload] = await Promise.all([
    fetchAuthed("/goalkeepers", token),
    fetchAuthed("/teams", token),
    fetchAuthed("/training-sessions", token),
    fetchAuthed("/evaluations", token),
  ]);

  const goalkeepers = extractArray<unknown>(goalkeepersPayload);
  const teams = extractArray<unknown>(teamsPayload);
  const sessions = extractArray<SessionEntity>(sessionsPayload);
  const evaluations = extractArray<EvaluationEntity>(evaluationsPayload);
  const teamsWithResponsible = teams.filter(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "coachId" in item &&
      Boolean((item as { coachId?: string | null }).coachId),
  );

  const uniqueResponsibles = new Set(
    teamsWithResponsible
      .map((item) => (item as { coachId?: string | null }).coachId)
      .filter((value): value is string => Boolean(value)),
  );

  const sessionsThisWeek = sessions.filter((session) => {
    return isDateInCurrentWeek(session.date ?? session.createdAt);
  }).length;

  const evaluationsThisWeek = evaluations.filter((evaluation) => {
    return isDateInCurrentWeek(evaluation.date ?? evaluation.createdAt);
  }).length;

  return {
    totalGoalkeepers: goalkeepers.length,
    totalCoaches: uniqueResponsibles.size,
    totalTeams: teams.length,
    totalSessions: sessions.length,
    sessionsThisWeek,
    evaluationsThisWeek,
    updatedAt: new Date().toISOString(),
  };
}

async function getServerSystemHealth(token: string | undefined) {
  const payload = await fetchAuthed("/health", token);

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const message = source.message;
    const status = source.status;

    if (typeof message === "string") {
      return { ok: true, label: message };
    }

    if (typeof status === "string") {
      return { ok: true, label: status };
    }
  }

  return { ok: true, label: "healthy" };
}

export default async function DashboardPage() {
  const queryClient = createQueryClient();
  const token = (await cookies()).get("gkx_access_token")?.value;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardKpis,
      queryFn: () => getServerDashboardKpis(token),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardHealth,
      queryFn: () => getServerSystemHealth(token),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}

