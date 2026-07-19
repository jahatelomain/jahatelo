export const MOTEL_PLANS = ['FREE', 'BASIC', 'GOLD', 'DIAMOND'] as const;

export type MotelPlan = (typeof MOTEL_PLANS)[number];

export function normalizeMotelPlan(plan: string | null | undefined): MotelPlan {
  const normalized = plan?.trim().toUpperCase();
  return MOTEL_PLANS.find((candidate) => candidate === normalized) ?? 'BASIC';
}

export const hasMotelPlanGlow = (plan: string | null | undefined) =>
  normalizeMotelPlan(plan) === 'DIAMOND';

export const isMotelPlanDisabled = (plan: string | null | undefined) =>
  normalizeMotelPlan(plan) === 'FREE';
