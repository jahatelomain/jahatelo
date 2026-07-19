import { fireEvent, render, screen } from '@testing-library/react';
import PromoCodeSettings from '@/components/admin/motel-detail/PromoCodeSettings';
import { createInitialPromoForm } from '@/components/admin/motel-detail/formDefaults';

describe('PromoCodeSettings', () => {
  it('reveals limits when promotional codes are enabled', () => {
    const onChange = jest.fn();
    render(<PromoCodeSettings form={createInitialPromoForm()} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ hasPromoCode: true }));
  });

  it('mentions both customer surfaces when enabled', () => {
    render(<PromoCodeSettings form={{ ...createInitialPromoForm(), hasPromoCode: true }} onChange={jest.fn()} />);
    expect(screen.getByText(/app y la web/)).toBeTruthy();
  });
});
