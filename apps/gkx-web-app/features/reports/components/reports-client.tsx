"use client";

import { useMemo, useState } from "react";
import { sileo } from "sileo";
import { useGoalkeepersQuery } from "@/features/goalkeepers/hooks/use-goalkeepers";
import {
  useTeamReportMutation,
  useSessionReportMutation,
  useGoalkeeperReportMutation,
} from "@/features/reports/hooks/use-reports";
import { useTeamsQuery } from "@/features/teams/hooks/use-teams";
import { useTrainingSessionsQuery } from "@/features/training-sessions/hooks/use-training-sessions";

function labelClass(disabled: boolean) {
  return disabled
    ? "rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-500"
    : "rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition";
}

export function ReportsClient() {
  const goalkeepersQuery = useGoalkeepersQuery();
  const teamsQuery = useTeamsQuery();
  const sessionsQuery = useTrainingSessionsQuery();

  const gkMutation = useGoalkeeperReportMutation();
  const teamMutation = useTeamReportMutation();
  const sessionMutation = useSessionReportMutation();

  const [goalkeeperId, setGoalkeeperId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const busy =
    gkMutation.isPending || teamMutation.isPending || sessionMutation.isPending;

  const goalkeepers = goalkeepersQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  const sortedSessions = useMemo(
     () => [...(sessionsQuery.data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
     [sessionsQuery.data],
  );

  const runWithToast = async (job: Promise<void>, successTitle: string) => {
    await sileo.promise(job, {
      loading: { title: "Generando reporte" },
      success: { title: successTitle },
      error: { title: "No se pudo generar el reporte" },
    });
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          Reports
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-100">
          Exportador tecnico PDF
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Genera reportes de rendimiento por portero, resumen de equipo y
          detalle de sesion.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            Goalkeeper report
          </h3>

          <div className="mt-3 space-y-3">
            <select
              value={goalkeeperId}
              onChange={(event) => setGoalkeeperId(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Selecciona portero</option>
              {goalkeepers.map((gk) => (
                <option key={gk.id} value={gk.id}>
                  {gk.name ?? gk.id}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <button
              type="button"
              disabled={!goalkeeperId || busy}
              onClick={async () => {
                await runWithToast(
                  gkMutation.mutateAsync({
                    goalkeeperId,
                    from: from || undefined,
                    to: to || undefined,
                  }),
                  "Reporte de portero descargado",
                );
              }}
              className={labelClass(!goalkeeperId || busy)}
            >
              Descargar PDF de portero
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            Team report
          </h3>

          <div className="mt-3 space-y-3">
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Selecciona equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <button
              type="button"
              disabled={!teamId || busy}
              onClick={async () => {
                await runWithToast(
                  teamMutation.mutateAsync({
                    teamId,
                    from: from || undefined,
                    to: to || undefined,
                  }),
                  "Reporte de equipo descargado",
                );
              }}
              className={labelClass(!teamId || busy)}
            >
              Descargar PDF de equipo
            </button>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
          Session report
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
             className="min-w-65 flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Selecciona sesion</option>
            {sortedSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.date} - {session.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!sessionId || busy}
            onClick={async () => {
              await runWithToast(
                sessionMutation.mutateAsync({ sessionId }),
                "Reporte de sesion descargado",
              );
            }}
            className={labelClass(!sessionId || busy)}
          >
            Descargar PDF de sesion
          </button>
        </div>
      </article>
    </section>
  );
}
