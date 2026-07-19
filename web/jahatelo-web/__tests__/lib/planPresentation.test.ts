import {
  hasMotelPlanGlow,
  isMotelPlanDisabled,
  normalizeMotelPlan,
} from '@/lib/domain/motels/planPresentation';

describe('motel plan presentation', () => {
  it('applies glow only to Diamond motels', () => {
    expect(hasMotelPlanGlow('DIAMOND')).toBe(true);
    expect(hasMotelPlanGlow('diamond')).toBe(true);
    expect(hasMotelPlanGlow('GOLD')).toBe(false);
    expect(hasMotelPlanGlow('BASIC')).toBe(false);
    expect(hasMotelPlanGlow('FREE')).toBe(false);
  });

  it('normalizes missing plans safely and keeps FREE disabled', () => {
    expect(normalizeMotelPlan(null)).toBe('BASIC');
    expect(isMotelPlanDisabled('FREE')).toBe(true);
  });
});
