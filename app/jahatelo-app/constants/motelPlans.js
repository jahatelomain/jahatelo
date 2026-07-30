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

// FREE sigue visible, pero se presenta con menor énfasis comercial. No implica
// que el motel sea inaccesible: la navegación debe permanecer habilitada.
export const isMotelPlanMuted = (plan) => normalizeMotelPlan(plan) === MOTEL_PLANS.FREE;
