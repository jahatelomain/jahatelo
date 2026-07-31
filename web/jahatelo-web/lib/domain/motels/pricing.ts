export type RoomPriceFields = {
  isActive?: boolean;
  price1h?: number | null;
  price1_5h?: number | null;
  price2h?: number | null;
  price3h?: number | null;
  price12h?: number | null;
  price24h?: number | null;
  priceNight?: number | null;
  dayRates?: Array<{
    dayGroup: 'WEEKDAY' | 'WEEKEND';
    price1h?: number | null;
    price1_5h?: number | null;
    price2h?: number | null;
    price3h?: number | null;
    price12h?: number | null;
    price24h?: number | null;
    priceNight?: number | null;
  }>;
};

type PriceKey = Exclude<keyof RoomPriceFields, 'isActive' | 'dayRates'>;
type EffectivePrices = Pick<RoomPriceFields, PriceKey>;

const PRICE_KEYS: PriceKey[] = [
  'price1h', 'price1_5h', 'price2h', 'price3h', 'price12h', 'price24h', 'priceNight',
];

export function getCurrentDayGroup(date = new Date()): 'WEEKDAY' | 'WEEKEND' {
  const day = date.getDay();
  return day === 5 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
}

/** Prioriza una tarifa especial del día sin modificar nunca el valor almacenado. */
export function getEffectiveRoomPrices(
  room: RoomPriceFields,
  dayGroup = getCurrentDayGroup(),
): EffectivePrices {
  const dayRate = room.dayRates?.find((rate) => rate.dayGroup === dayGroup);
  return PRICE_KEYS.reduce<EffectivePrices>((prices, key) => {
    prices[key] = dayRate?.[key] ?? room[key] ?? null;
    return prices;
  }, {});
}

/** Devuelve el menor precio positivo cargado entre las habitaciones activas. */
export function getStartingRoomPrice(
  rooms?: RoomPriceFields[],
  dayGroup = getCurrentDayGroup(),
): number | null {
  const prices = (rooms || [])
    .filter((room) => room.isActive !== false)
    .flatMap((room) => Object.values(getEffectiveRoomPrices(room, dayGroup)))
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Mínimos publicados para cada tipo de día, sin alterar ninguna tarifa cargada. */
export function getStartingRoomPricesByDay(rooms?: RoomPriceFields[]) {
  return {
    weekday: getStartingRoomPrice(rooms, 'WEEKDAY'),
    weekend: getStartingRoomPrice(rooms, 'WEEKEND'),
  };
}
