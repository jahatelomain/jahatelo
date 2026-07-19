import { render, screen } from '@testing-library/react';
import MenuForms from '@/components/admin/motel-detail/MenuForms';

const baseProps = {
  categoryForm: { title: '', sortOrder: 0 },
  itemForm: { name: '', price: '', description: '' },
  categoryFormDirty: false,
  itemFormDirty: false,
  onCategoryChange: jest.fn(),
  onItemChange: jest.fn(),
  onSaveCategory: jest.fn(),
  onSaveItem: jest.fn(),
  onCancelCategory: jest.fn(),
  onCancelItem: jest.fn(),
};

describe('MenuForms', () => {
  it('renders only the active form', () => {
    const { rerender } = render(<MenuForms {...baseProps} showCategoryForm showItemForm={false} />);
    expect(screen.getByText('Nueva Categoría')).toBeTruthy();
    rerender(<MenuForms {...baseProps} showCategoryForm={false} showItemForm />);
    expect(screen.getByText('Nuevo Item')).toBeTruthy();
    expect(screen.queryByText('Nueva Categoría')).toBeNull();
  });
});
