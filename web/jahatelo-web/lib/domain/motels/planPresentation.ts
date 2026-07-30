export const MOTEL_PLANS = ['FREE', 'BASIC', 'GOLD', 'DIAMOND'] as const;

export type MotelPlan = (typeof MOTEL_PLANS)[number];

export type MotelAnalyticsAccess = 'NONE' | 'SUMMARY' | 'FULL';

export function normalizeMotelPlan(plan: string | null | undefined): MotelPlan {
  const normalized = plan?.trim().toUpperCase();
  return MOTEL_PLANS.find((candidate) => candidate === normalized) ?? 'BASIC';
}

export const hasMotelPlanGlow = (plan: string | null | undefined) =>
  normalizeMotelPlan(plan) === 'DIAMOND';

export const isMotelPlanDisabled = (plan: string | null | undefined) =>
  normalizeMotelPlan(plan) === 'FREE';

/** Un plan FREE se muestra públicamente, pero solo con su información base. */
export const isFreeMotelPlan = (plan: string | null | undefined) =>
  normalizeMotelPlan(plan) === 'FREE';

/**
 * Define el nivel comercial de Analytics para el panel del motel.
 * Esta regla se reutiliza en navegación, UI y APIs: la interfaz por sí sola
 * nunca debe ser la única barrera de acceso.
 */
export function getMotelAnalyticsAccess(plan: string | null | undefined): MotelAnalyticsAccess {
  switch (normalizeMotelPlan(plan)) {
    case 'FREE':
      return 'NONE';
    case 'BASIC':
      return 'SUMMARY';
    case 'GOLD':
    case 'DIAMOND':
      return 'FULL';
  }
}
