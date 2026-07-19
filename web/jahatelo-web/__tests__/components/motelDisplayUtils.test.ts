import {
  formatLimit,
  formatPrice,
  getPlanLabel,
  getPlanPromoLimit,
  getPlanRoomPhotoLimit,
  sortByExplicitOrder,
} from '@/components/admin/motel-detail/displayUtils';

describe('motel admin display utilities', () => {
  it('preserves plan labels and limits', () => {
    expect(getPlanLabel('BASIC')).toBe('Básico');
    expect(getPlanLabel('gold')).toBe('Gold');
    expect(getPlanPromoLimit('DIAMOND')).toBe(Number.POSITIVE_INFINITY);
    expect(getPlanRoomPhotoLimit('GOLD')).toBe(3);
    expect(formatLimit(Number.POSITIVE_INFINITY)).toBe('Ilimitadas');
  });

  it('formats missing and valid prices safely', () => {
    expect(formatPrice(null)).toBe('0');
    expect(formatPrice(150000).replace(/\D/g, '')).toBe('150000');
  });

  it('keeps the optimistic room order before the API refreshes', () => {
    const rooms = [
      { id: 'a', name: 'Suite', order: 0 },
      { id: 'b', name: 'Presidencial', order: 1 },
      { id: 'c', name: 'Junior', order: 2 },
    ];

    expect(sortByExplicitOrder(rooms, ['c', 'a', 'b']).map((room) => room.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(rooms.map((room) => room.id)).toEqual(['a', 'b', 'c']);
  });
});
