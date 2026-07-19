import { render, screen } from '@testing-library/react';
import PriceTable from '@/components/public/PriceTable';

describe('PriceTable', () => {
  it('uses the same duration labels as the app and formats guaranies consistently', () => {
    render(
      <PriceTable
        prices={[
          { label: '1h', price: 150000 },
          { label: 'Dormida', price: 450000 },
        ]}
      />,
    );

    expect(screen.getByText('1h')).toBeTruthy();
    expect(screen.getByText('Dormida')).toBeTruthy();
    expect(screen.getByText('Gs. 150.000')).toBeTruthy();
    expect(screen.getByText('Gs. 450.000')).toBeTruthy();
    expect(screen.queryByText('Mejor precio')).toBeNull();
  });
});
