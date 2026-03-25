"use client";

import { useMemo, useState } from "react";
import { sileo } from "sileo";
import { useAuth } from "@/features/auth/use-auth";
import {
  useActiveSubscriptionQuery,
  useChangeTenantPlanMutation,
  useMyPlanChangeRequestsQuery,
  usePlanChangeRequestsQuery,
  usePlanOffersQuery,
  usePlanUsageQuery,
  useReviewPlanChangeRequestMutation,
  useSubscriptionsQuery,
  useTenantsQuery,
  useTenantSubscriptionsQuery,
  useUpdateSubscriptionMutation,
} from "@/features/billing/hooks/use-billing";
import {
  PlanChangeRequestStatus,
  SubscriptionEntity,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/api/subscriptions";

type SubscriptionDraft = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  externalRef: string;
};

const PLAN_OPTIONS: SubscriptionPlan[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
const STATUS_OPTIONS: SubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
];

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("es-ES");
}

function toInputDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function statusBadgeClass(status: PlanChangeRequestStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-lime-100 text-lime-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-sky-100 text-sky-800";
  }
}

function SuperAdminSubscriptionsPanel() {
  const tenantsQuery = useTenantsQuery(true);
  const subscriptionsQuery = useSubscriptionsQuery(true);
  const updateMutation = useUpdateSubscriptionMutation();

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, SubscriptionDraft>>({});

  const tenants = tenantsQuery.data ?? [];
  const subscriptions = useMemo(
    () => subscriptionsQuery.data ?? [],
    [subscriptionsQuery.data],
  );

  const effectiveTenantId = selectedTenantId || tenants[0]?.id || "";

  const filteredSubscriptions = useMemo(() => {
    if (!effectiveTenantId) return subscriptions;
    return subscriptions.filter((item) => item.tenantId === effectiveTenantId);
  }, [effectiveTenantId, subscriptions]);

  const getDraft = (item: SubscriptionEntity): SubscriptionDraft => {
    return (
      drafts[item.id] ?? {
        plan: item.plan,
        status: item.status,
        currentPeriodStart: toInputDate(item.currentPeriodStart),
        currentPeriodEnd: toInputDate(item.currentPeriodEnd),
        externalRef: item.externalRef ?? "",
      }
    );
  };

  const onChangeDraft = (
    id: string,
    key: keyof SubscriptionDraft,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          plan: "FREE",
          status: "TRIALING",
          currentPeriodStart: "",
          currentPeriodEnd: "",
          externalRef: "",
        }),
        [key]: value,
      },
    }));
  };

  const saveRow = async (item: SubscriptionEntity) => {
    const draft = getDraft(item);

    const pending = updateMutation.mutateAsync({
      id: item.id,
      payload: {
        plan: draft.plan,
        status: draft.status,
        currentPeriodStart: new Date(draft.currentPeriodStart).toISOString(),
        currentPeriodEnd: new Date(draft.currentPeriodEnd).toISOString(),
        externalRef: draft.externalRef || undefined,
      },
    });

    await sileo.promise(pending, {
      loading: { title: "Guardando suscripcion" },
      success: { title: "Suscripcion actualizada" },
      error: { title: "No se pudo actualizar" },
    });
  };

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          SUPER_ADMIN
        </p>
        <select
          value={effectiveTenantId}
          onChange={(event) => setSelectedTenantId(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      <h3 className="mt-2 text-lg font-bold text-zinc-900">
        Gestion de suscripciones por tenant
      </h3>

      {tenantsQuery.isLoading || subscriptionsQuery.isLoading ? (
        <p className="mt-3 text-sm text-zinc-500">Cargando datos...</p>
      ) : filteredSubscriptions.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
          No hay suscripciones para el tenant seleccionado.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Inicio</th>
                <th className="px-2 py-2">Fin</th>
                <th className="px-2 py-2">External Ref</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((item) => {
                const draft = getDraft(item);
                return (
                  <tr key={item.id} className="border-b border-zinc-100">
                    <td className="px-2 py-2">
                      <select
                        value={draft.plan}
                        onChange={(event) =>
                          onChangeDraft(item.id, "plan", event.target.value)
                        }
                        className="rounded-lg border border-zinc-300 px-2 py-1"
                      >
                        {PLAN_OPTIONS.map((plan) => (
                          <option key={plan} value={plan}>
                            {plan}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          onChangeDraft(item.id, "status", event.target.value)
                        }
                        className="rounded-lg border border-zinc-300 px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="datetime-local"
                        value={draft.currentPeriodStart}
                        onChange={(event) =>
                          onChangeDraft(
                            item.id,
                            "currentPeriodStart",
                            event.target.value,
                          )
                        }
                        className="rounded-lg border border-zinc-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="datetime-local"
                        value={draft.currentPeriodEnd}
                        onChange={(event) =>
                          onChangeDraft(item.id, "currentPeriodEnd", event.target.value)
                        }
                        className="rounded-lg border border-zinc-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={draft.externalRef}
                        onChange={(event) =>
                          onChangeDraft(item.id, "externalRef", event.target.value)
                        }
                        placeholder="sub_xxx"
                        className="w-44 rounded-lg border border-zinc-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void saveRow(item)}
                        disabled={updateMutation.isPending}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function SuperAdminSpeiReviewPanel() {
  const requestsQuery = usePlanChangeRequestsQuery(true, "PENDING_REVIEW");
  const reviewMutation = useReviewPlanChangeRequestMutation();

  const review = async (id: string, approved: boolean) => {
    const pending = reviewMutation.mutateAsync({ id, approved });
    await sileo.promise(pending, {
      loading: { title: approved ? "Aprobando SPEI" : "Rechazando SPEI" },
      success: {
        title: approved ? "Plan activado" : "Solicitud rechazada",
      },
      error: { title: "No se pudo procesar la solicitud" },
    });
  };

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
        SUPER_ADMIN
      </p>
      <h3 className="mt-2 text-lg font-bold text-zinc-900">
        Revisar pagos SPEI pendientes
      </h3>

      {requestsQuery.isLoading ? (
        <p className="mt-3 text-sm text-zinc-500">Cargando solicitudes...</p>
      ) : (requestsQuery.data?.length ?? 0) === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
          No hay pagos SPEI pendientes de revision.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {requestsQuery.data?.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Tenant {request.tenantId.slice(0, 8)}... / Plan {request.requestedPlan}
                </p>
                <p className="text-xs text-zinc-500">
                  Metodo: {request.paymentMethod} · {new Date(request.createdAt).toLocaleString("es-ES")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void review(request.id, true)}
                  className="rounded-lg bg-lime-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => void review(request.id, false)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function UsageCard({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number | null;
}) {
  const percent = useMemo(() => {
    if (limit == null || limit <= 0) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  }, [current, limit]);

  const zone =
    percent >= 90
      ? "bg-red-500"
      : percent >= 75
        ? "bg-amber-500"
        : "bg-lime-500";

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-sm text-zinc-500">
          {limit == null ? `${current} / ∞` : `${current} / ${limit}`}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full ${zone} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {limit == null ? "Sin limite" : `${percent}% usado`}
      </p>
    </article>
  );
}

export function BillingClient() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const changePlanMutation = useChangeTenantPlanMutation();
  const planOffersQuery = usePlanOffersQuery(!isSuperAdmin);
  const myRequestsQuery = useMyPlanChangeRequestsQuery(!isSuperAdmin);
  const activeSubscriptionQuery = useActiveSubscriptionQuery();
  const subscriptionsQuery = useTenantSubscriptionsQuery();
  const usageQuery = usePlanUsageQuery(!isSuperAdmin);

  if (!isSuperAdmin && !user?.tenantId) {
    return (
      <p className="text-sm text-zinc-500">
        No hay tenant asociado al usuario actual.
      </p>
    );
  }

  const handlePlanChange = async (
    plan: SubscriptionPlan,
    paymentMethod: "CARD" | "SPEI",
  ) => {
    if (!user?.tenantId || isSuperAdmin) return;

    const pending = changePlanMutation.mutateAsync({
      plan,
      paymentMethod,
    });

    const result = await sileo.promise(pending, {
      loading: { title: "Creando solicitud de cambio" },
      success: {
        title:
          paymentMethod === "CARD"
            ? "Redirigiendo a checkout"
            : "Solicitud SPEI registrada",
      },
      error: { title: "No se pudo crear la solicitud" },
    });

    if (result?.checkoutUrl && typeof window !== "undefined") {
      window.location.assign(result.checkoutUrl);
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Billing
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">
          Suscripcion y limites del plan
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Vista consolidada de estado de suscripcion y consumo por modulo.
        </p>
      </header>

      {isSuperAdmin ? <SuperAdminSubscriptionsPanel /> : null}
      {isSuperAdmin ? <SuperAdminSpeiReviewPanel /> : null}

      {!isSuperAdmin ? <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Suscripcion activa
          </p>
          {activeSubscriptionQuery.isLoading ? (
            <p className="mt-3 text-sm text-zinc-500">
              Cargando suscripcion...
            </p>
          ) : !activeSubscriptionQuery.data ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
              No hay suscripcion activa para este tenant.
            </p>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Plan</dt>
                <dd className="font-semibold text-zinc-900">
                  {activeSubscriptionQuery.data.plan}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Estado</dt>
                <dd className="font-semibold text-zinc-900">
                  {activeSubscriptionQuery.data.status}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Periodo</dt>
                <dd className="text-zinc-900">
                  {formatDateLabel(activeSubscriptionQuery.data.currentPeriodStart)} - {formatDateLabel(activeSubscriptionQuery.data.currentPeriodEnd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Referencia externa</dt>
                <dd className="text-zinc-900">
                  {activeSubscriptionQuery.data.externalRef ?? "-"}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Planes disponibles
            </p>
            <div className="mt-2 space-y-2">
              {(planOffersQuery.data ?? []).map((offer) => (
                <div
                  key={offer.plan}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {offer.label} · ${offer.monthlyPriceMxn} MXN / mes
                  </p>
                  <p className="text-xs text-zinc-600">{offer.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handlePlanChange(offer.plan, "CARD")}
                      disabled={changePlanMutation.isPending}
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Pagar con tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePlanChange(offer.plan, "SPEI")}
                      disabled={changePlanMutation.isPending}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 disabled:opacity-60"
                    >
                      Solicitar por SPEI
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-zinc-200 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                Solicitudes recientes
              </p>
              {myRequestsQuery.isLoading ? (
                <p className="mt-2 text-sm text-zinc-500">Cargando solicitudes...</p>
              ) : (myRequestsQuery.data?.length ?? 0) === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">Sin solicitudes recientes.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {myRequestsQuery.data?.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <p className="text-zinc-700">
                        {item.requestedPlan} · {item.paymentMethod}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 font-semibold ${statusBadgeClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Uso del plan
          </p>
          {usageQuery.isLoading || !usageQuery.data ? (
            <p className="mt-3 text-sm text-zinc-500">Cargando uso...</p>
          ) : (
            <div className="mt-3 space-y-3">
              <UsageCard
                label="Goalkeepers"
                current={usageQuery.data.usage.goalkeepers}
                limit={usageQuery.data.limits.goalkeepers}
              />
              <UsageCard
                label="Teams"
                current={usageQuery.data.usage.teams}
                limit={usageQuery.data.limits.teams}
              />
              <UsageCard
                label="Users"
                current={usageQuery.data.usage.users}
                limit={usageQuery.data.limits.users}
              />
              <UsageCard
                label="Sessions / month"
                current={usageQuery.data.usage.sessionsPerMonth}
                limit={usageQuery.data.limits.sessionsPerMonth}
              />
            </div>
          )}
        </article>
      </div> : null}

      {!isSuperAdmin ? <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Historial de suscripciones
        </p>

        {subscriptionsQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Cargando historial...</p>
        ) : (subscriptionsQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
            Sin registros de suscripciones para este tenant.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <th className="px-2 py-2">Plan</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Fin</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionsQuery.data?.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100">
                    <td className="px-2 py-2 font-medium text-zinc-900">
                      {item.plan}
                    </td>
                    <td className="px-2 py-2 text-zinc-700">{item.status}</td>
                    <td className="px-2 py-2 text-zinc-700">
                      {new Date(item.currentPeriodStart).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>
                    <td className="px-2 py-2 text-zinc-700">
                      {new Date(item.currentPeriodEnd).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article> : null}
    </section>
  );
}
