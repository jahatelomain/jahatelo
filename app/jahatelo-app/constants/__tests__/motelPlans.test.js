/* global describe, expect, it */
import {
  hasMotelPlanGlow,
  isMotelPlanDisabled,
  normalizeMotelPlan,
} from '../motelPlans';

describe('motel plan presentation', () => {
  it('applies glow only to Diamond motels', () => {
    expect(hasMotelPlanGlow('DIAMOND')).toBe(true);
    expect(hasMotelPlanGlow('diamond')).toBe(true);
    expect(hasMotelPlanGlow('GOLD')).toBe(false);
    expect(hasMotelPlanGlow('BASIC')).toBe(false);
    expect(hasMotelPlanGlow('FREE')).toBe(false);
  });

  it('uses BASIC as the safe fallback and keeps FREE disabled', () => {
    expect(normalizeMotelPlan()).toBe('BASIC');
    expect(isMotelPlanDisabled('FREE')).toBe(true);
  });
});
