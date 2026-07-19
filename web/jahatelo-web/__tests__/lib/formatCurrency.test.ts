import { formatGuaranies } from '@/lib/formatCurrency';

describe('formatGuaranies', () => {
  it('uses the Paraguayan thousands separator and the Gs. prefix', () => {
    expect(formatGuaranies(1234567)).toBe('Gs. 1.234.567');
  });
});
