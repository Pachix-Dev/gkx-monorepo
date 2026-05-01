"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import { useAuth } from "@/features/auth/use-auth";
import {
  useActiveSubscriptionQuery,
  useCancelSpeiAtPeriodEndMutation,
  useCancelAutoRenewMutation,
  useChangeTenantPlanMutation,
  useCustomerPortalSessionMutation,
  useMyPlanChangeRequestsQuery,
  usePlanChangeRequestsQuery,
  usePlanOffersQuery,
  usePlanUsageQuery,
  useReactivateAutoRenewMutation,
  useReviewPlanChangeRequestMutation,
  useScheduleStripeDowngradeMutation,
  useSubscriptionsQuery,
  useTenantsQuery,
  useTenantSubscriptionsQuery,
  useUpdateSubscriptionMutation,
} from "@/features/billing/hooks/use-billing";
import {
  PlanOffer,
  PlanChangeRequestStatus,
  SubscriptionEntity,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/api/subscriptions";

type SubscriptionDraft = {
  status: SubscriptionStatus;
};

const STATUS_OPTIONS: SubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
];

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
};

const PLAN_FEATURES: Record<
  SubscriptionPlan,
  { text: string; included: boolean }[]
> = {
  FREE: [
    { text: "1 equipo", included: true },
    { text: "3 usuarios", included: true },
    { text: "Soporte base", included: true },
    { text: "Automatizaciones avanzadas", included: false },
    { text: "Multi-sede", included: false },
  ],
  BASIC: [
    { text: "5 equipos", included: true },
    { text: "10 usuarios", included: true },
    { text: "Planificacion semanal", included: true },
    { text: "Soporte prioritario", included: false },
    { text: "Multi-sede", included: false },
  ],
  PRO: [
    { text: "20 equipos", included: true },
    { text: "50 usuarios", included: true },
    { text: "Analitica avanzada", included: true },
    { text: "Biblioteca de sesiones", included: true },
    { text: "Multi-sede", included: false },
  ],
};

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("es-ES");
}

function billingIntervalLabel(interval: "month" | "year") {
  return interval === "year" ? "año" : "mes";
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
  const cancelSpeiMutation = useCancelSpeiAtPeriodEndMutation();

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
        status: item.status,
      }
    );
  };

  const onChangeDraft = (id: string, value: SubscriptionStatus) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          status: "TRIALING",
        }),
        status: value,
      },
    }));
  };

  const saveRow = async (item: SubscriptionEntity) => {
    const draft = getDraft(item);

    const pending = updateMutation.mutateAsync({
      id: item.id,
      payload: {
        status: draft.status,
      },
    });

    await sileo.promise(pending, {
      loading: { title: "Guardando suscripcion" },
      success: { title: "Suscripcion actualizada" },
      error: { title: "No se pudo actualizar" },
    });
  };

    const cancelSpeiRow = async (item: SubscriptionEntity) => {
      const pending = cancelSpeiMutation.mutateAsync(item.tenantId);
      await sileo.promise(pending, {
        loading: { title: "Programando cancelacion SPEI" },
        success: { title: "Se cancelará al fin del período" },
        error: { title: "No se pudo programar la cancelacion" },
      });
    };

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          SUPER_ADMIN
        </p>
        <select
          value={effectiveTenantId}
          onChange={(event) => setSelectedTenantId(event.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      <h3 className="mt-2 text-lg font-bold text-white">
        Gestion de suscripciones por tenant
      </h3>

      {tenantsQuery.isLoading || subscriptionsQuery.isLoading ? (
        <p className="mt-3 text-sm text-zinc-400">Cargando datos...</p>
      ) : filteredSubscriptions.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3 text-sm text-zinc-300">
          No hay suscripciones para el tenant seleccionado.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-[0.12em] text-zinc-400">
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
                  <tr key={item.id} className="border-b border-zinc-900">
                    <td className="px-2 py-2">
                      <span className="inline-flex rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200">
                        {item.plan}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          onChangeDraft(item.id, event.target.value as SubscriptionStatus)
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-zinc-200">
                        {formatDateLabel(item.currentPeriodStart)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-zinc-200">
                        {formatDateLabel(item.currentPeriodEnd)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="font-mono text-xs text-zinc-300">
                        {item.externalRef ?? "-"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveRow(item)}
                            disabled={updateMutation.isPending}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            Guardar
                          </button>
                          {!item.stripeSubscriptionId && !item.cancelAtPeriodEnd ? (
                          <button
                            type="button"
                            onClick={() => void cancelSpeiRow(item)}
                            disabled={cancelSpeiMutation.isPending}
                            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-60"
                          >
                            Cancelar SPEI
                          </button>
                          ) : null}
                        </div>
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
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
        SUPER_ADMIN
      </p>
      <h3 className="mt-2 text-lg font-bold text-white">
        Revisar pagos SPEI pendientes
      </h3>

      {requestsQuery.isLoading ? (
        <p className="mt-3 text-sm text-zinc-400">Cargando solicitudes...</p>
      ) : (requestsQuery.data?.length ?? 0) === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3 text-sm text-zinc-300">
          No hay pagos SPEI pendientes de revision.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {requestsQuery.data?.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  Tenant {request.tenantId.slice(0, 8)}... / Plan {request.requestedPlan}
                </p>
                <p className="text-xs text-zinc-400">
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
    <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-sm text-zinc-400">
          {limit == null ? `${current} / ∞` : `${current} / ${limit}`}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full ${zone} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {limit == null ? "Sin limite" : `${percent}% usado`}
      </p>
    </article>
  );
}

export function BillingClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const changePlanMutation = useChangeTenantPlanMutation();
  const scheduleDowngradeMutation = useScheduleStripeDowngradeMutation();
  const cancelAutoRenewMutation = useCancelAutoRenewMutation();
  const cancelSpeiAtPeriodEndMutation = useCancelSpeiAtPeriodEndMutation();
  const reactivateAutoRenewMutation = useReactivateAutoRenewMutation();
  const customerPortalMutation = useCustomerPortalSessionMutation();
  const planOffersQuery = usePlanOffersQuery(!isSuperAdmin);
  const myRequestsQuery = useMyPlanChangeRequestsQuery(!isSuperAdmin);
  const activeSubscriptionQuery = useActiveSubscriptionQuery();
  const subscriptionsQuery = useTenantSubscriptionsQuery();
  const usageQuery = usePlanUsageQuery(!isSuperAdmin);

  const paymentResult = searchParams.get("payment");
  const shouldPollAfterCheckout = !isSuperAdmin && paymentResult === "success";

  const currentPlan = activeSubscriptionQuery.data?.plan ?? "FREE";
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  const planOffers = useMemo<PlanOffer[]>(() => {
    const offers = planOffersQuery.data ?? [];
    if (offers.some((offer) => offer.plan === "FREE")) {
      return offers;
    }

    return [
      {
        plan: "FREE",
        label: "Free",
        priceMxn: 0,
        billingInterval: "month",
        description: "Acceso inicial para comenzar sin costo.",
        paymentMethods: [],
        cardEnabled: false,
      },
      ...offers,
    ];
  }, [planOffersQuery.data]);

  useEffect(() => {
    if (!shouldPollAfterCheckout) return;

    const start = Date.now();
    const timeoutMs = 30_000;
    const intervalMs = 3_000;

    const interval = window.setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        window.clearInterval(interval);
        return;
      }

      void Promise.all([
        activeSubscriptionQuery.refetch(),
        subscriptionsQuery.refetch(),
        myRequestsQuery.refetch(),
        usageQuery.refetch(),
      ]).then((results) => {
        const activeResult = results[0].data;
        const requestsResult = results[2].data ?? [];
        const hasCompletedRequest = requestsResult.some(
          (item) => item.status === "COMPLETED",
        );

        const isPaidPlanActive =
          activeResult != null &&
          activeResult.status === "ACTIVE" &&
          activeResult.plan !== "FREE";

        if (hasCompletedRequest || isPaidPlanActive) {
          window.clearInterval(interval);
        }
      });
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    shouldPollAfterCheckout,
    activeSubscriptionQuery,
    subscriptionsQuery,
    myRequestsQuery,
    usageQuery,
  ]);

  useEffect(() => {
    if (!isPlansModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPlansModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlansModalOpen]);

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
            ? "Solicitud de plan procesada"
            : "Solicitud SPEI registrada",
      },
      error: { title: "No se pudo crear la solicitud" },
    });

    if (result?.checkoutUrl && typeof window !== "undefined") {
      window.location.assign(result.checkoutUrl);
      return;
    }

    setIsPlansModalOpen(false);
    await Promise.all([
      activeSubscriptionQuery.refetch(),
      subscriptionsQuery.refetch(),
      myRequestsQuery.refetch(),
      usageQuery.refetch(),
    ]);
  };

  const handleCustomerPortal = async () => {
    if (!user?.tenantId || isSuperAdmin) return;

    const pending = customerPortalMutation.mutateAsync(user.tenantId);
    const result = await sileo.promise(pending, {
      loading: { title: "Abriendo portal de Stripe" },
      success: { title: "Redirigiendo al portal" },
      error: { title: "No se pudo abrir el portal" },
    });

    if (result?.url && typeof window !== "undefined") {
      window.location.assign(result.url);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!user?.tenantId || isSuperAdmin) return;

    const pending = cancelAutoRenewMutation.mutateAsync(user.tenantId);
    await sileo.promise(pending, {
      loading: { title: "Programando cancelacion al fin del periodo" },
      success: { title: "Auto-renovacion desactivada" },
      error: { title: "No se pudo cancelar la auto-renovacion" },
    });
  };

    const handleScheduleDowngrade = async (plan: SubscriptionPlan) => {
      if (!user?.tenantId || isSuperAdmin) return;

      const pending = scheduleDowngradeMutation.mutateAsync({
        tenantId: user.tenantId,
        plan,
      });

      await sileo.promise(pending, {
        loading: { title: "Programando downgrade" },
        success: { title: "Downgrade programado para el siguiente periodo" },
        error: { title: "No se pudo programar el downgrade" },
      });
    };

  const handleReactivateAutoRenew = async () => {
    if (!user?.tenantId || isSuperAdmin) return;

    const pending = reactivateAutoRenewMutation.mutateAsync(user.tenantId);
    await sileo.promise(pending, {
      loading: { title: "Reactivando auto-renovacion" },
      success: { title: "Auto-renovacion reactivada" },
      error: { title: "No se pudo reactivar la auto-renovacion" },
    });
  };

  const handleGoFreeAtPeriodEnd = async () => {
    if (!user?.tenantId || isSuperAdmin || !activeSubscriptionQuery.data) return;

    const pending = activeSubscriptionQuery.data.stripeSubscriptionId
      ? cancelAutoRenewMutation.mutateAsync(user.tenantId)
      : cancelSpeiAtPeriodEndMutation.mutateAsync(user.tenantId);

    await sileo.promise(pending, {
      loading: { title: "Programando cambio a FREE" },
      success: { title: "Se aplicará al final del periodo actual" },
      error: { title: "No se pudo programar el cambio" },
    });
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          Billing
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Suscripcion y limites del plan
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          Vista consolidada de estado de suscripcion y consumo por modulo.
        </p>
      </header>

      {isSuperAdmin ? <SuperAdminSubscriptionsPanel /> : null}
      {isSuperAdmin ? <SuperAdminSpeiReviewPanel /> : null}

      {!isSuperAdmin ? <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Suscripcion activa
          </p>
          {activeSubscriptionQuery.isLoading ? (
            <p className="mt-3 text-sm text-zinc-400">
              Cargando suscripcion...
            </p>
          ) : !activeSubscriptionQuery.data ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3 text-sm text-zinc-300">
              No hay suscripcion activa para este tenant.
            </p>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Plan</dt>
                <dd className="font-semibold text-white">
                  {activeSubscriptionQuery.data.plan}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Estado</dt>
                <dd className="font-semibold text-white">
                  {activeSubscriptionQuery.data.status}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Periodo</dt>
                <dd className="text-white">
                  {formatDateLabel(activeSubscriptionQuery.data.currentPeriodStart)} - {formatDateLabel(activeSubscriptionQuery.data.currentPeriodEnd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Referencia externa</dt>
                <dd className="text-white">
                  {activeSubscriptionQuery.data.externalRef ?? "-"}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
              Renovacion
            </p>
            <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-sm text-zinc-200">
                {activeSubscriptionQuery.data?.cancelAtPeriodEnd
                  ? "Tu suscripcion esta programada para terminar al final del periodo actual."
                  : "Tu suscripcion esta en modo auto-renovacion."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeSubscriptionQuery.data?.stripeSubscriptionId ? (
                  activeSubscriptionQuery.data.cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      onClick={() => void handleReactivateAutoRenew()}
                      disabled={reactivateAutoRenewMutation.isPending}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Reactivar auto-renovacion
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCancelAutoRenew()}
                      disabled={cancelAutoRenewMutation.isPending}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100 disabled:opacity-60"
                    >
                      Cancelar al final del periodo
                    </button>
                  )
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleCustomerPortal()}
                  disabled={customerPortalMutation.isPending}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100 disabled:opacity-60"
                >
                  Administrar en Stripe
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-zinc-400">
              Planes disponibles
            </p>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-sm text-zinc-200">
                Consulta todos los planes, beneficios y acciones disponibles.
              </p>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                View plans
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                Solicitudes recientes
              </p>
              {myRequestsQuery.isLoading ? (
                <p className="mt-2 text-sm text-zinc-400">Cargando solicitudes...</p>
              ) : (myRequestsQuery.data?.length ?? 0) === 0 ? (
                <p className="mt-2 text-sm text-zinc-300">Sin solicitudes recientes.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {myRequestsQuery.data?.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <p className="text-zinc-200">
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

        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Uso del plan
          </p>
          {usageQuery.isLoading || !usageQuery.data ? (
            <p className="mt-3 text-sm text-zinc-400">Cargando uso...</p>
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
              {/*<UsageCard
                label="Users"
                current={usageQuery.data.usage.users}
                limit={usageQuery.data.limits.users}
              />*/}
              <UsageCard
                label="Sessions / month"
                current={usageQuery.data.usage.sessionsPerMonth}
                limit={usageQuery.data.limits.sessionsPerMonth}
              />
            </div>
          )}
        </article>
      </div> : null}

      {!isSuperAdmin ? <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm shadow-black/20">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
          Historial de suscripciones
        </p>

        {subscriptionsQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-400">Cargando historial...</p>
        ) : (subscriptionsQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3 text-sm text-zinc-300">
            Sin registros de suscripciones para este tenant.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-[0.12em] text-zinc-400">
                  <th className="px-2 py-2">Plan</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Fin</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionsQuery.data?.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-900">
                    <td className="px-2 py-2 font-medium text-white">
                      {item.plan}
                    </td>
                    <td className="px-2 py-2 text-zinc-200">{item.status}</td>
                    <td className="px-2 py-2 text-zinc-200">
                      {new Date(item.currentPeriodStart).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>
                    <td className="px-2 py-2 text-zinc-200">
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

      {!isSuperAdmin && isPlansModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsPlansModalOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-6xl rounded-2xl border border-zinc-800 bg-black p-4 shadow-2xl shadow-black/50"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Planes disponibles"
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Billing</p>
                <h3 className="text-lg font-bold text-white">Planes y beneficios</h3>
                <p className="text-sm text-zinc-300">
                  Downgrade y cambio a FREE se aplican al final del periodo actual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid max-h-[75vh] gap-3 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
              {planOffers.map((offer) => {
                const isCurrentPlan = PLAN_RANK[offer.plan] === PLAN_RANK[currentPlan];
                const isDowngrade = PLAN_RANK[offer.plan] < PLAN_RANK[currentPlan];
                const isUpgrade = PLAN_RANK[offer.plan] > PLAN_RANK[currentPlan];
                const isRecommended = offer.plan === "PRO";

                return (
                  <article
                    key={offer.plan}
                    className={`rounded-2xl border p-4 ${
                      isCurrentPlan
                        ? "border-primary/70 bg-zinc-900"
                        : "border-zinc-800 bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-white">{offer.label}</h4>
                        {isRecommended ? (
                          <span className="mt-1 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isCurrentPlan ? (
                          <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                            Current
                          </span>
                        ) : null}
                        {isDowngrade ? (
                          <span className="rounded-full bg-sky-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300">
                            Downgrade
                          </span>
                        ) : null}
                        {isUpgrade ? (
                          <span className="rounded-full bg-violet-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">
                            Upgrade
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2 text-2xl font-bold text-white">
                      ${offer.priceMxn} MXN
                      <span className="text-sm font-medium text-zinc-300"> / {billingIntervalLabel(offer.billingInterval)}</span>
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">{offer.description}</p>

                    <div className="mt-4 h-px w-full bg-zinc-800" />

                    <ul className="mt-4 space-y-2 text-xs">
                      {(PLAN_FEATURES[offer.plan] ?? []).map((feature) => (
                        <li
                          key={feature.text}
                          className={`flex items-start gap-2 ${
                            feature.included ? "text-zinc-100" : "text-zinc-500"
                          }`}
                        >
                          <span
                            className={`mt-[2px] inline-block h-4 w-4 rounded-full text-center text-[10px] leading-4 ${
                              feature.included
                                ? "bg-emerald-500/30 text-emerald-300"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {feature.included ? "+" : "-"}
                          </span>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                      <li className="text-zinc-400">
                        Metodos: {offer.paymentMethods.length > 0 ? offer.paymentMethods.join(" + ") : "Sin pago recurrente"}
                      </li>
                    </ul>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {offer.plan === "FREE" ? (
                        <button
                          type="button"
                          onClick={() => void handleGoFreeAtPeriodEnd()}
                          disabled={
                            currentPlan === "FREE" ||
                            activeSubscriptionQuery.data?.cancelAtPeriodEnd ||
                            cancelAutoRenewMutation.isPending ||
                            cancelSpeiAtPeriodEndMutation.isPending
                          }
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 disabled:opacity-60"
                        >
                          {activeSubscriptionQuery.data?.cancelAtPeriodEnd
                            ? "Cambio a FREE programado"
                            : "Downgrade to Free"}
                        </button>
                      ) : null}

                      {isCurrentPlan && offer.plan !== "FREE" ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-70"
                        >
                          Current plan
                        </button>
                      ) : null}

                      {isUpgrade ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handlePlanChange(offer.plan, "CARD")}
                            disabled={changePlanMutation.isPending || !offer.cardEnabled}
                            className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            Pagar con tarjeta
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePlanChange(offer.plan, "SPEI")}
                            disabled={changePlanMutation.isPending}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 disabled:opacity-60"
                          >
                            Solicitar por SPEI
                          </button>
                        </>
                      ) : null}

                      {isDowngrade && offer.plan !== "FREE" ? (
                        <button
                          type="button"
                          onClick={() => void handleScheduleDowngrade(offer.plan)}
                          disabled={scheduleDowngradeMutation.isPending}
                          className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-60"
                        >
                          Programar downgrade
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
