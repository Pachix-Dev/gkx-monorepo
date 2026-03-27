import { TenantPlan } from '../tenants/tenant.entity';
import { PlanPaymentMethod } from './plan-change-request.entity';

export type PlanOffer = {
  plan: TenantPlan;
  label: string;
  priceMxn: number;
  billingInterval: 'month' | 'year';
  description: string;
  paymentMethods: PlanPaymentMethod[];
  cardEnabled: boolean;
};

const DEFAULT_PRICES: Record<TenantPlan, number> = {
  [TenantPlan.FREE]: 0,
  [TenantPlan.BASIC]: 499,
  [TenantPlan.PRO]: 1299,
  [TenantPlan.ENTERPRISE]: 2999,
};

const DEFAULT_INTERVALS: Record<TenantPlan, 'month' | 'year'> = {
  [TenantPlan.FREE]: 'month',
  [TenantPlan.BASIC]: 'month',
  [TenantPlan.PRO]: 'year',
  [TenantPlan.ENTERPRISE]: 'year',
};

function resolvePlanPrice(plan: TenantPlan): number {
  const envKey = `PLAN_PRICE_MXN_${plan}`;
  const fromEnv = process.env[envKey];
  const parsed = Number(fromEnv);
  if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  return DEFAULT_PRICES[plan];
}

function resolvePlanInterval(plan: TenantPlan): 'month' | 'year' {
  const envKey = `PLAN_BILLING_INTERVAL_${plan}`;
  const raw = process.env[envKey]?.trim().toLowerCase();
  if (raw === 'month' || raw === 'year') return raw;
  return DEFAULT_INTERVALS[plan];
}

function resolveRecurringPriceId(plan: TenantPlan): string | null {
  if (plan === TenantPlan.FREE) {
    return null;
  }

  const raw = process.env[`STRIPE_PRICE_ID_${plan}`]?.trim();
  return raw ? raw : null;
}

export function getRecurringPlanPriceId(plan: TenantPlan): string | null {
  return resolveRecurringPriceId(plan);
}

export function mapStripePriceToPlan(raw: string | null): TenantPlan | null {
  if (!raw) return null;

  for (const plan of [
    TenantPlan.BASIC,
    TenantPlan.PRO,
    TenantPlan.ENTERPRISE,
  ]) {
    const configuredPriceId = resolveRecurringPriceId(plan);
    if (configuredPriceId && configuredPriceId === raw) {
      return plan;
    }
  }

  const normalized = raw.toLowerCase();
  if (normalized.includes('enterprise')) return TenantPlan.ENTERPRISE;
  if (normalized.includes('pro')) return TenantPlan.PRO;
  if (normalized.includes('basic')) return TenantPlan.BASIC;
  if (normalized.includes('free')) return TenantPlan.FREE;

  return null;
}

export function getPlanOffers(): PlanOffer[] {
  return [
    {
      plan: TenantPlan.FREE,
      label: 'Free',
      priceMxn: resolvePlanPrice(TenantPlan.FREE),
      billingInterval: resolvePlanInterval(TenantPlan.FREE),
      description: 'Acceso inicial para comenzar sin costo.',
      paymentMethods: [],
      cardEnabled: false,
    },
    {
      plan: TenantPlan.BASIC,
      label: 'Basic',
      priceMxn: resolvePlanPrice(TenantPlan.BASIC),
      billingInterval: resolvePlanInterval(TenantPlan.BASIC),
      description: 'Para academias pequenas que inician operaciones.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
      cardEnabled: Boolean(resolveRecurringPriceId(TenantPlan.BASIC)),
    },
    {
      plan: TenantPlan.PRO,
      label: 'Pro',
      priceMxn: resolvePlanPrice(TenantPlan.PRO),
      billingInterval: resolvePlanInterval(TenantPlan.PRO),
      description: 'Escalado para academias con operacion continua.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
      cardEnabled: Boolean(resolveRecurringPriceId(TenantPlan.PRO)),
    },
    {
      plan: TenantPlan.ENTERPRISE,
      label: 'Enterprise',
      priceMxn: resolvePlanPrice(TenantPlan.ENTERPRISE),
      billingInterval: resolvePlanInterval(TenantPlan.ENTERPRISE),
      description: 'Capacidad extendida para organizaciones multi-sede.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
      cardEnabled: Boolean(resolveRecurringPriceId(TenantPlan.ENTERPRISE)),
    },
  ];
}
