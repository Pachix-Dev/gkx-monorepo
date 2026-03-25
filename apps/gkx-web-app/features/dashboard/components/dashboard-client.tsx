"use client";

import Link from "next/link";
import { sileo } from "sileo";
import {
  useDashboardAlertsQuery,
  useDashboardHealthQuery,
  useDashboardKpisQuery,
  useDashboardTrendsQuery,
} from "@/features/dashboard/hooks/use-dashboard";

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "lime" | "blue" | "orange" | "slate";
}) {
  const accentClass = {
    lime: "from-lime-200 to-lime-100 text-lime-900",
    blue: "from-sky-200 to-sky-100 text-sky-900",
    orange: "from-amber-200 to-amber-100 text-amber-900",
    slate: "from-zinc-200 to-zinc-100 text-zinc-900",
  }[accent];

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <div className={`mt-3 rounded-xl bg-linear-to-r px-3 py-2 ${accentClass}`}>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </article>
  );
}

export function DashboardClient() {
  const kpisQuery = useDashboardKpisQuery();
  const trendsQuery = useDashboardTrendsQuery();
  const healthQuery = useDashboardHealthQuery();
  const alertsQuery = useDashboardAlertsQuery();

  const errorMessage =
    (kpisQuery.error instanceof Error && kpisQuery.error.message) ||
    (trendsQuery.error instanceof Error && trendsQuery.error.message) ||
    (healthQuery.error instanceof Error && healthQuery.error.message) ||
    "";

  const refresh = async () => {
    const pending = Promise.all([
      kpisQuery.refetch(),
      trendsQuery.refetch(),
      healthQuery.refetch(),
      alertsQuery.refetch(),
    ]);

    await sileo.promise(pending, {
      loading: { title: "Actualizando dashboard" },
      success: { title: "Dashboard actualizado" },
      error: {
        title: "No se pudo actualizar",
        description: "Revisa el estado de la API",
      },
    });
  };

  const topGoalkeepers = trendsQuery.data?.avgScorePerGoalkeeper ?? [];

  return (
    <section className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime-200/50 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-sky-200/40 blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Control Center</h2>
            <p className="text-sm text-zinc-600">
              KPI operativos, tendencias y rendimiento por tenant.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-zinc-300 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Refrescar datos
          </button>
        </div>
      </header>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Goalkeepers"
          value={kpisQuery.data?.totalGoalkeepers ?? 0}
          accent="lime"
        />
        <KpiCard
          label="Teams"
          value={kpisQuery.data?.totalTeams ?? 0}
          accent="blue"
        />
        <KpiCard
          label="Sessions"
          value={kpisQuery.data?.totalSessions ?? 0}
          accent="slate"
        />
        <KpiCard
          label="Avg Score"
          value={
            kpisQuery.data?.avgOverallScore != null
              ? kpisQuery.data.avgOverallScore
              : "-"
          }
          accent="orange"
        />
      </div>

      <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Alertas de limite
        </h3>

        {alertsQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Calculando alertas...</p>
        ) : (alertsQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-500">
            No hay tenants cerca del limite.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {alertsQuery.data?.slice(0, 8).map((alert) => (
              <div
                key={`${alert.tenantId}-${alert.resource}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  alert.severity === "critical"
                    ? "border-red-300 bg-red-50 text-red-900"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Health & Alerts
            </h3>
            <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
              {healthQuery.data?.label ?? "-"}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-zinc-200 p-3">
              <dt className="text-zinc-500">Sessions this month</dt>
              <dd className="mt-1 text-xl font-bold text-zinc-900">
                {kpisQuery.data?.sessionsThisMonth ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <dt className="text-zinc-500">Evaluations this month</dt>
              <dd className="mt-1 text-xl font-bold text-zinc-900">
                {kpisQuery.data?.evaluationsThisMonth ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <dt className="text-zinc-500">Attendance rate</dt>
              <dd className="mt-1 text-xl font-bold text-zinc-900">
                {kpisQuery.data?.attendanceRatePercent ?? 0}%
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <dt className="text-zinc-500">Active users</dt>
              <dd className="mt-1 text-xl font-bold text-zinc-900">
                {kpisQuery.data?.activeUsers ?? 0}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-zinc-500">
            Ultima actualizacion:{" "}
            {kpisQuery.data?.updatedAt
              ? new Date(kpisQuery.data.updatedAt).toLocaleString("es-ES")
              : "-"}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Top rendimiento
          </h3>

          <div className="mt-4 space-y-2">
            {topGoalkeepers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-500">
                Sin datos de evaluaciones para mostrar ranking.
              </p>
            ) : (
              topGoalkeepers.slice(0, 6).map((item, index) => (
                <div
                  key={item.goalkeeperId}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2"
                >
                  <p className="text-sm text-zinc-700">
                    #{index + 1} - {item.goalkeeperId.slice(0, 8)}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {item.avg} ({item.evaluationsCount} eval.)
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Quick actions
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/users"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Gestionar users
          </Link>
          <Link
            href="/training-sessions"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-800 transition hover:bg-zinc-100"
          >
            Ver sesiones
          </Link>
          <Link
            href="/reports"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-800 transition hover:bg-zinc-100"
          >
            Exportar reportes
          </Link>
        </div>
      </div>
    </section>
  );
}
