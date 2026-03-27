import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";

export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";
export type SubscriptionPlan = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
export type PlanPaymentMethod = "CARD" | "SPEI";
export type PlanChangeRequestStatus =
  | "PENDING_PAYMENT"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "REJECTED";

export type SubscriptionEntity = {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionItemId: string | null;
  stripePriceId: string | null;
    stripeScheduleId: string | null;
  externalRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSubscriptionInput = {
  status: SubscriptionStatus;
};

export type PlanOffer = {
  plan: SubscriptionPlan;
  label: string;
  priceMxn: number;
  billingInterval: "month" | "year";
  description: string;
  paymentMethods: PlanPaymentMethod[];
  cardEnabled: boolean;
};

export type PlanChangeRequest = {
  id: string;
  tenantId: string;
  requestedByUserId: string | null;
  requestedPlan: SubscriptionPlan;
  paymentMethod: PlanPaymentMethod;
  status: PlanChangeRequestStatus;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getSubscriptions(): Promise<SubscriptionEntity[]> {
  const payload = await apiRequest<unknown>(`/subscriptions`, {
    method: "GET",
    auth: true,
  });

  return extractArray<SubscriptionEntity>(payload);
}

export async function getTenantSubscriptions(
  tenantId: string,
): Promise<SubscriptionEntity[]> {
  const payload = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}`,
    {
      method: "GET",
      auth: true,
    },
  );
  return extractArray<SubscriptionEntity>(payload);
}

export async function getActiveSubscription(
  tenantId: string,
): Promise<SubscriptionEntity | null> {
  const payload = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/active`,
    {
      method: "GET",
      auth: true,
    },
  );
  const data = extractData<SubscriptionEntity | null>(payload);
  return data ?? null;
}

export async function updateSubscription(
  id: string,
  payload: UpdateSubscriptionInput,
): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(`/subscriptions/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });

  return extractData<SubscriptionEntity>(response);
}

export async function changeTenantPlan(
  tenantId: string,
  plan: SubscriptionPlan,
): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/change-plan`,
    {
      method: "PATCH",
      auth: true,
      body: { plan },
    },
  );

  return extractData<SubscriptionEntity>(response);
}

export async function getPlanOffers(): Promise<PlanOffer[]> {
  const payload = await apiRequest<unknown>(`/subscriptions/plans`, {
    method: "GET",
    auth: true,
  });

  return extractArray<PlanOffer>(payload);
}

export async function createPlanChangeRequest(payload: {
  plan: SubscriptionPlan;
  paymentMethod: PlanPaymentMethod;
  tenantId?: string;
}): Promise<{
  request: PlanChangeRequest;
  checkoutUrl?: string;
  instructions?: string;
}> {
  const response = await apiRequest<unknown>(`/subscriptions/change-requests`, {
    method: "POST",
    auth: true,
    body: payload,
  });

  return extractData<{
    request: PlanChangeRequest;
    checkoutUrl?: string;
    instructions?: string;
  }>(response);
}

export async function getMyPlanChangeRequests(): Promise<PlanChangeRequest[]> {
  const payload = await apiRequest<unknown>(`/subscriptions/change-requests/my`, {
    method: "GET",
    auth: true,
  });
  return extractArray<PlanChangeRequest>(payload);
}

export async function getPlanChangeRequests(status?: PlanChangeRequestStatus): Promise<PlanChangeRequest[]> {
  const suffix = status ? `?status=${status}` : "";
  const payload = await apiRequest<unknown>(
    `/subscriptions/change-requests${suffix}`,
    {
      method: "GET",
      auth: true,
    },
  );
  return extractArray<PlanChangeRequest>(payload);
}

export async function reviewPlanChangeRequest(
  id: string,
  payload: { decision: "APPROVE" | "REJECT"; notes?: string },
): Promise<PlanChangeRequest> {
  const response = await apiRequest<unknown>(
    `/subscriptions/change-requests/${id}/review`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
    },
  );

  return extractData<PlanChangeRequest>(response);
}

export async function createCustomerPortalSession(
  tenantId: string,
): Promise<{ url: string }> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/customer-portal-session`,
    {
      method: "POST",
      auth: true,
    },
  );

  return extractData<{ url: string }>(response);
}

export async function cancelAutoRenew(tenantId: string): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/cancel-auto-renew`,
    {
      method: "POST",
      auth: true,
    },
  );

  return extractData<SubscriptionEntity>(response);
}

export async function reactivateAutoRenew(
  tenantId: string,
): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/reactivate-auto-renew`,
    {
      method: "POST",
      auth: true,
    },
  );

  return extractData<SubscriptionEntity>(response);
}

export async function scheduleStripeDowngrade(
  tenantId: string,
  plan: SubscriptionPlan,
): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/schedule-downgrade`,
    {
      method: "POST",
      auth: true,
      body: { plan },
    },
  );

  return extractData<SubscriptionEntity>(response);
}

export async function cancelSpeiAtPeriodEnd(
  tenantId: string,
): Promise<SubscriptionEntity> {
  const response = await apiRequest<unknown>(
    `/subscriptions/tenant/${tenantId}/cancel-spei-at-period-end`,
    {
      method: "POST",
      auth: true,
    },
  );

  return extractData<SubscriptionEntity>(response);
}
