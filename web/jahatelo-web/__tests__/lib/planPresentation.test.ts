import {
  getMotelAnalyticsAccess,
  normalizeMotelPlan,
} from '@/lib/domain/motels/planPresentation';

describe('planPresentation', () => {
  it('normaliza los planes de motel conocidos', () => {
    expect(normalizeMotelPlan('gold')).toBe('GOLD');
    expect(normalizeMotelPlan(null)).toBe('BASIC');
  });

  it('define Analytics según el plan comercial', () => {
    expect(getMotelAnalyticsAccess('FREE')).toBe('NONE');
    expect(getMotelAnalyticsAccess('BASIC')).toBe('SUMMARY');
    expect(getMotelAnalyticsAccess('GOLD')).toBe('FULL');
    expect(getMotelAnalyticsAccess('DIAMOND')).toBe('FULL');
  });
});
