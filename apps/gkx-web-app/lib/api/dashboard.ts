import { apiRequest } from "@/lib/api/client";
import { extractArray } from "@/lib/api/response";

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

export async function getDashboardKpis() {
  const [goalkeepersPayload, teamsPayload, sessionsPayload, evaluationsPayload] = await Promise.all([
    apiRequest<unknown>("/goalkeepers", { method: "GET", auth: true }),
    apiRequest<unknown>("/teams", { method: "GET", auth: true }),
    apiRequest<unknown>("/training-sessions", { method: "GET", auth: true }),
    apiRequest<unknown>("/evaluations", { method: "GET", auth: true }),
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

export async function getSystemHealth() {
  const payload = await apiRequest<unknown>("/health", {
    method: "GET",
    auth: true,
  });

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
