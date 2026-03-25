import { TenantPlan } from '../tenants/tenant.entity';
import { PlanPaymentMethod } from './plan-change-request.entity';

export type PlanOffer = {
  plan: TenantPlan;
  label: string;
  monthlyPriceMxn: number;
  description: string;
  paymentMethods: PlanPaymentMethod[];
};

const DEFAULT_PRICES: Record<TenantPlan, number> = {
  [TenantPlan.FREE]: 0,
  [TenantPlan.BASIC]: 499,
  [TenantPlan.PRO]: 1299,
  [TenantPlan.ENTERPRISE]: 2999,
};

function resolvePlanPrice(plan: TenantPlan): number {
  const envKey = `PLAN_PRICE_MXN_${plan}`;
  const fromEnv = process.env[envKey];
  const parsed = Number(fromEnv);
  if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  return DEFAULT_PRICES[plan];
}

export function getPlanOffers(): PlanOffer[] {
  return [
    {
      plan: TenantPlan.BASIC,
      label: 'Basic',
      monthlyPriceMxn: resolvePlanPrice(TenantPlan.BASIC),
      description: 'Para academias pequenas que inician operaciones.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
    },
    {
      plan: TenantPlan.PRO,
      label: 'Pro',
      monthlyPriceMxn: resolvePlanPrice(TenantPlan.PRO),
      description: 'Escalado para academias con operacion continua.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
    },
    {
      plan: TenantPlan.ENTERPRISE,
      label: 'Enterprise',
      monthlyPriceMxn: resolvePlanPrice(TenantPlan.ENTERPRISE),
      description: 'Capacidad extendida para organizaciones multi-sede.',
      paymentMethods: [PlanPaymentMethod.CARD, PlanPaymentMethod.SPEI],
    },
  ];
}
