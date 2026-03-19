"use client";

import Link from "next/link";
import { sileo } from "sileo";
import { useDashboardHealthQuery, useDashboardKpisQuery } from "@/features/dashboard/hooks/use-dashboard";

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-card-foreground">{value}</p>
    </article>
  );
}

export function DashboardClient() {
  const kpisQuery = useDashboardKpisQuery();
  const healthQuery = useDashboardHealthQuery();

  const errorMessage =
    (kpisQuery.error instanceof Error && kpisQuery.error.message) ||
    (healthQuery.error instanceof Error && healthQuery.error.message) ||
    "";

  const refresh = async () => {
    const pending = Promise.all([kpisQuery.refetch(), healthQuery.refetch()]);

    await sileo.promise(pending, {
      loading: { title: "Actualizando dashboard" },
      success: { title: "Dashboard actualizado" },
      error: { title: "No se pudo actualizar", description: "Revisa el estado de la API" },
    });
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-card-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Resumen operativo conectado a API.</p>
      </header>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">API health</span>
            <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              {healthQuery.data?.label ?? "-"}
            </span>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Refrescar KPI
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Ultima actualizacion: {kpisQuery.data?.updatedAt ? new Date(kpisQuery.data.updatedAt).toLocaleString("es-ES") : "-"}
        </p>
      </div>

      {kpisQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="mt-3 h-8 w-20 rounded bg-muted" />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Total goalkeepers" value={kpisQuery.data?.totalGoalkeepers ?? 0} />
          <KpiCard label="Total coaches" value={kpisQuery.data?.totalCoaches ?? 0} />
          <KpiCard label="Total teams" value={kpisQuery.data?.totalTeams ?? 0} />
          <KpiCard label="Total sessions" value={kpisQuery.data?.totalSessions ?? 0} />
          <KpiCard label="Sessions this week" value={kpisQuery.data?.sessionsThisWeek ?? 0} />
          <KpiCard label="Evaluations this week" value={kpisQuery.data?.evaluationsThisWeek ?? 0} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Quick actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/users"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Gestionar users
          </Link>
          <Link
            href="/training-sessions"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            Ver sesiones
          </Link>
          <Link
            href="/goalkeepers"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            Ver porteros
          </Link>
        </div>
      </div>
    </section>
  );
}
