"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/use-auth";
import { getPlanUsage } from "@/lib/api/plan-limits";
import {
  cancelAutoRenew,
  cancelSpeiAtPeriodEnd,
  createCustomerPortalSession,
  createPlanChangeRequest,
  getActiveSubscription,
  getMyPlanChangeRequests,
  getPlanChangeRequests,
  getPlanOffers,
  getSubscriptions,
  getTenantSubscriptions,
  PlanChangeRequestStatus,
  reactivateAutoRenew,
  reviewPlanChangeRequest,
  scheduleStripeDowngrade,
  SubscriptionPlan,
  updateSubscription,
  UpdateSubscriptionInput,
} from "@/lib/api/subscriptions";
import { getTenants } from "@/lib/api/tenants";
import { queryKeys } from "@/lib/query/keys";

export function usePlanUsageQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.planUsage,
    queryFn: getPlanUsage,
    enabled,
  });
}

export function useTenantSubscriptionsQuery() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? undefined;

  return useQuery({
    queryKey: queryKeys.subscriptionsByTenant(tenantId),
    queryFn: () => getTenantSubscriptions(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useActiveSubscriptionQuery() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? undefined;

  return useQuery({
    queryKey: queryKeys.activeSubscriptionByTenant(tenantId),
    queryFn: () => getActiveSubscription(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useTenantsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: getTenants,
    enabled,
  });
}

export function useSubscriptionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: getSubscriptions,
    enabled,
  });
}

export function useUpdateSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubscriptionInput;
    }) => updateSubscription(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.planUsage }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function useChangeTenantPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plan,
      paymentMethod,
    }: {
      plan: SubscriptionPlan;
      paymentMethod: "CARD" | "SPEI";
    }) => createPlanChangeRequest({ plan, paymentMethod }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.planUsage }),
        queryClient.invalidateQueries({ queryKey: queryKeys.planOffers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myPlanChangeRequests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function usePlanOffersQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.planOffers,
    queryFn: getPlanOffers,
    enabled,
  });
}

export function useMyPlanChangeRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myPlanChangeRequests,
    queryFn: getMyPlanChangeRequests,
    enabled,
  });
}

export function usePlanChangeRequestsQuery(
  enabled: boolean,
  status?: PlanChangeRequestStatus,
) {
  return useQuery({
    queryKey: queryKeys.planChangeRequests(status),
    queryFn: () => getPlanChangeRequests(status),
    enabled,
  });
}

export function useReviewPlanChangeRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approved,
      notes,
    }: {
      id: string;
      approved: boolean;
      notes?: string;
    }) =>
      reviewPlanChangeRequest(id, {
        decision: approved ? "APPROVE" : "REJECT",
        notes,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.planChangeRequests() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      ]);
    },
  });
}

export function useCustomerPortalSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => createCustomerPortalSession(tenantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function useCancelAutoRenewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => cancelAutoRenew(tenantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.planUsage }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function useReactivateAutoRenewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => reactivateAutoRenew(tenantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.planUsage }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function useScheduleStripeDowngradeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      plan,
    }: {
      tenantId: string;
      plan: SubscriptionPlan;
    }) => scheduleStripeDowngrade(tenantId, plan),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}

export function useCancelSpeiAtPeriodEndMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => cancelSpeiAtPeriodEnd(tenantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "tenant"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAlerts }),
      ]);
    },
  });
}
