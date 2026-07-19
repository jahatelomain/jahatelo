import { fireEvent, render, screen } from '@testing-library/react';
import RoomList from '@/components/admin/motel-detail/RoomList';
import type { RoomType } from '@/components/admin/motel-detail/types';

const room = (id: string, name: string): RoomType => ({
  id,
  name,
  description: null,
  price1h: null,
  price1_5h: null,
  price2h: null,
  price3h: null,
  price12h: null,
  price24h: null,
  priceNight: null,
  maxPersons: null,
  hasJacuzzi: false,
  isFeatured: false,
  isActive: true,
  amenities: [],
  roomPhotos: [],
});

const baseProps = {
  planLabel: 'Gold',
  photoLimit: '3',
  uploadingRoomId: null,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onAddPhoto: jest.fn(),
  onUploadPhoto: jest.fn(),
  onReorderPhotos: jest.fn(),
  onDeletePhoto: jest.fn(),
};

describe('RoomList', () => {
  it('shows the empty state', () => {
    render(<RoomList {...baseProps} rooms={[]} onReorder={jest.fn()} />);
    expect(screen.getByText('No hay habitaciones registradas')).not.toBeNull();
  });

  it('reorders rooms with the accessible controls', () => {
    const onReorder = jest.fn();
    render(
      <RoomList
        {...baseProps}
        rooms={[room('one', 'Primera'), room('two', 'Segunda')]}
        onReorder={onReorder}
      />,
    );
    fireEvent.click(screen.getAllByLabelText('Mover habitación hacia abajo')[0]);
    expect(onReorder).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'two' }),
      expect.objectContaining({ id: 'one' }),
    ]);
  });
});
