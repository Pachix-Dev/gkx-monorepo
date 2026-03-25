"use client";

import { useAuth } from "@/features/auth/use-auth";
import { SessionAttendancePanel } from "./session-attendance-panel";
import { useTrainingSessionsQuery } from "@/features/training-sessions/hooks/use-training-sessions";
import { useMemo, useState } from "react";

export function AttendanceClient() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  const sessionsQuery = useTrainingSessionsQuery();
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const tenantSessions = useMemo(
    () => sessions.filter((item) => item.tenantId === tenantId),
    [sessions, tenantId],
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const selectedSession = useMemo(
    () => tenantSessions.find((item) => item.id === selectedSessionId) ?? null,
    [selectedSessionId, tenantSessions],
  );

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">Attendance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona asistencia por sesión de entrenamiento.
        </p>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Sesión</span>
          <select
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Selecciona sesión</option>
            {tenantSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} - {new Date(session.date).toLocaleDateString("es-ES")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedSession ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <SessionAttendancePanel
            key={selectedSession.id}
            sessionId={selectedSession.id}
            tenantId={tenantId}
            teamId={selectedSession.teamId ?? null}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Selecciona una sesión para registrar asistencia.
        </div>
      )}
    </section>
  );
}
