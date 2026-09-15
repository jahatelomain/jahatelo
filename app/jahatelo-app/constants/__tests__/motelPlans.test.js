/* global describe, expect, it */
import {
  hasMotelPlanGlow,
  isMotelPlanMuted,
  normalizeMotelPlan,
} from '../motelPlans';

describe('motel plan presentation', () => {
  it('applies glow to premium highlighted plans', () => {
    expect(hasMotelPlanGlow('DIAMOND')).toBe(true);
    expect(hasMotelPlanGlow('diamond')).toBe(true);
    expect(hasMotelPlanGlow('GOLD')).toBe(true);
    expect(hasMotelPlanGlow('BASIC')).toBe(false);
    expect(hasMotelPlanGlow('FREE')).toBe(false);
  });

  it('uses BASIC as the safe fallback and presents FREE as muted', () => {
    expect(normalizeMotelPlan()).toBe('BASIC');
    expect(isMotelPlanMuted('FREE')).toBe(true);
  });
});
