import { fireEvent, render, screen } from '@testing-library/react';
import SortablePhotoGrid from '@/components/admin/motel-detail/SortablePhotoGrid';

describe('SortablePhotoGrid', () => {
  const photos = [
    { id: 'second', url: '/second.jpg', order: 2 },
    { id: 'first', url: '/first.jpg', order: 1 },
  ];

  it('orders photos explicitly and moves them with accessible controls', () => {
    const onReorder = jest.fn();
    render(<SortablePhotoGrid photos={photos} alt="Habitación" onReorder={onReorder} onDelete={jest.fn()} />);
    fireEvent.click(screen.getAllByLabelText('Mover foto hacia la derecha')[0]);
    expect(onReorder).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'second' }),
      expect.objectContaining({ id: 'first' }),
    ]);
  });

  it('delegates deletion', () => {
    const onDelete = jest.fn();
    render(<SortablePhotoGrid photos={photos} alt="Habitación" onReorder={jest.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByLabelText('Eliminar foto')[0]);
    expect(onDelete).toHaveBeenCalledWith('first');
  });
});
