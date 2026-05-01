import { TenantPlan } from '../tenants/tenant.entity';

export interface PlanLimits {
  goalkeepers: number;
  teams: number;
  sessionsPerMonth: number;
  users: number;
}

export const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  [TenantPlan.FREE]: {
    goalkeepers: 1,
    teams: 1,
    sessionsPerMonth: 1,
    users: 1,
  },
  [TenantPlan.BASIC]: {
    goalkeepers: 20,
    teams: 3,
    sessionsPerMonth: 50,
    users: 5,
  },
  [TenantPlan.PRO]: {
    goalkeepers: 100,
    teams: 10,
    sessionsPerMonth: 200,
    users: 15,
  },
};

export type PlanLimitResource = keyof PlanLimits;
