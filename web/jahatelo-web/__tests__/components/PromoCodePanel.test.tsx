import { fireEvent, render, screen } from '@testing-library/react';
import PromoCodePanel from '@/components/admin/motel-detail/PromoCodePanel';

describe('PromoCodePanel', () => {
  it('normalizes input and requests verification', () => {
    const onInputChange = jest.fn();
    const onVerify = jest.fn();
    render(<PromoCodePanel promoId="promo-1" input="ABC123" loading={false} result={null} expanded={false} codes={[]} onInputChange={onInputChange} onVerify={onVerify} onConfirm={jest.fn()} onToggleHistory={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Código promocional'), { target: { value: 'ab12cd' } });
    expect(onInputChange).toHaveBeenCalledWith('AB12CD');
    fireEvent.click(screen.getByText('Verificar'));
    expect(onVerify).toHaveBeenCalled();
  });

  it('shows the redeem confirmation for a valid code', () => {
    render(<PromoCodePanel promoId="promo-1" input="ABC123" loading={false} result={{ valid: true, promoTitle: 'Promo demo' }} expanded={false} codes={[]} onInputChange={jest.fn()} onVerify={jest.fn()} onConfirm={jest.fn()} onToggleHistory={jest.fn()} />);
    expect(screen.getByText('Confirmar uso (irreversible)')).not.toBeNull();
  });
});
