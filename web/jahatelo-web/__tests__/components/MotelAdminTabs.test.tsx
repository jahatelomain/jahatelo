import { fireEvent, render, screen } from '@testing-library/react';
import MotelAdminTabs from '@/components/admin/motel-detail/MotelAdminTabs';

describe('MotelAdminTabs', () => {
  it('preserves counts and tab changes without duplicating the Analytics navigation', () => {
    const onChange = jest.fn();
    render(
      <MotelAdminTabs
        activeTab="details"
        motelId="motel-123"
        roomCount={4}
        promoCount={2}
        menuCategoryCount={3}
        reviewCount={8}
        onChange={onChange}
      />,
    );

    expect(screen.getByText(/Habitaciones/).textContent).toContain('(4)');
    expect(screen.getByText(/Promos/).textContent).toContain('(2)');
    expect(screen.getByText(/Menú/).textContent).toContain('(3)');
    expect(screen.getByText(/Reseñas/).textContent).toContain('(8)');
    expect(screen.queryByRole('link', { name: 'Analytics' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Habitaciones/ }));
    expect(onChange).toHaveBeenCalledWith('rooms');
  });
});
