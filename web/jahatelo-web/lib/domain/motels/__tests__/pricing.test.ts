import { getEffectiveRoomPrices, getStartingRoomPrice, getStartingRoomPricesByDay } from '../pricing';

describe('room pricing', () => {
  it('uses the lowest positive price from active rooms', () => {
    expect(getStartingRoomPrice([
      { isActive: true, priceNight: 214000, price1h: 50000 },
      { isActive: true, price1_5h: 45000 },
      { isActive: false, price1h: 1000 },
    ])).toBe(45000);
  });

  it('returns null when no active room has a price', () => {
    expect(getStartingRoomPrice([{ isActive: true, priceNight: null }, { isActive: false, price1h: 50000 }])).toBeNull();
  });

  it('keeps independent weekday and weekend minimum prices', () => {
    const rooms = [{
      isActive: true,
      priceNight: 150000,
      dayRates: [
        { dayGroup: 'WEEKDAY' as const, priceNight: 180000 },
        { dayGroup: 'WEEKEND' as const, priceNight: 240000 },
      ],
    }];

    expect(getStartingRoomPricesByDay(rooms)).toEqual({ weekday: 180000, weekend: 240000 });
  });

  it('uses a day-rate value exactly as stored without recalculating it', () => {
    const prices = getEffectiveRoomPrices({
      priceNight: 214000,
      dayRates: [{ dayGroup: 'WEEKDAY', priceNight: 213996 }],
    }, 'WEEKDAY');

    expect(prices.priceNight).toBe(213996);
  });
});
