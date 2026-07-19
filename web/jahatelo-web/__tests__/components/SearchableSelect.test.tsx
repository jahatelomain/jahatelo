import { fireEvent, render, screen } from '@testing-library/react';
import SearchableSelect from '@/components/admin/SearchableSelect';

describe('SearchableSelect', () => {
  const options = [
    { value: '1', label: 'Motel Italia - Concepción' },
    { value: '2', label: 'Motel Venecia - Ñemby' },
  ];

  it('filters incrementally and selects the result', () => {
    const onChange = jest.fn();
    render(<SearchableSelect value="" options={options} placeholder="Buscar motel" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'venecia' } });
    expect(screen.queryByText('Motel Italia - Concepción')).toBeNull();
    fireEvent.click(screen.getByText('Motel Venecia - Ñemby'));
    expect(onChange).toHaveBeenCalledWith('2');
  });
});
