export const MOTEL_PLANS = Object.freeze({
  FREE: 'FREE',
  BASIC: 'BASIC',
  GOLD: 'GOLD',
  DIAMOND: 'DIAMOND',
});

export const normalizeMotelPlan = (plan) => {
  const normalized = typeof plan === 'string' ? plan.trim().toUpperCase() : '';
  return MOTEL_PLANS[normalized] || MOTEL_PLANS.BASIC;
};

export const hasMotelPlanGlow = (plan) => normalizeMotelPlan(plan) === MOTEL_PLANS.DIAMOND;

export const isMotelPlanDisabled = (plan) => normalizeMotelPlan(plan) === MOTEL_PLANS.FREE;
