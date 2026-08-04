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
  weekdayRates?: Array<{
    weekday: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    duration: 'H1' | 'H1_5' | 'H2' | 'H3' | 'H12' | 'H24' | 'NIGHT';
    price: number;
  }>;
};

type PriceKey = Exclude<keyof RoomPriceFields, 'isActive' | 'dayRates' | 'weekdayRates'>;
type EffectivePrices = Pick<RoomPriceFields, PriceKey>;

const PRICE_KEYS: PriceKey[] = [
  'price1h', 'price1_5h', 'price2h', 'price3h', 'price12h', 'price24h', 'priceNight',
];

export function getCurrentDayGroup(date = new Date()): 'WEEKDAY' | 'WEEKEND' {
  const weekday = getCurrentWeekday(date);
  return weekday === 'FRIDAY' || weekday === 'SATURDAY' ? 'WEEKEND' : 'WEEKDAY';
}

const WEEKDAY_BY_SHORT_NAME: Record<string, NonNullable<RoomPriceFields['weekdayRates']>[number]['weekday']> = {
  Sun: 'SUNDAY', Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY', Fri: 'FRIDAY', Sat: 'SATURDAY',
};
const DURATION_BY_PRICE_KEY: Record<PriceKey, NonNullable<RoomPriceFields['weekdayRates']>[number]['duration']> = {
  price1h: 'H1', price1_5h: 'H1_5', price2h: 'H2', price3h: 'H3', price12h: 'H12', price24h: 'H24', priceNight: 'NIGHT',
};

export function getCurrentWeekday(date = new Date()) {
  return WEEKDAY_BY_SHORT_NAME[new Intl.DateTimeFormat('en-US', { timeZone: 'America/Asuncion', weekday: 'short' }).format(date)] ?? 'SUNDAY';
}

/** Prioriza una tarifa especial del día sin modificar nunca el valor almacenado. */
export function getEffectiveRoomPrices(
  room: RoomPriceFields,
  dayGroup = getCurrentDayGroup(),
  weekday = getCurrentWeekday(),
): EffectivePrices {
  const dayRate = room.dayRates?.find((rate) => rate.dayGroup === dayGroup);
  return PRICE_KEYS.reduce<EffectivePrices>((prices, key) => {
    const exactRate = room.weekdayRates?.find((rate) => rate.weekday === weekday && rate.duration === DURATION_BY_PRICE_KEY[key]);
    prices[key] = exactRate?.price ?? dayRate?.[key] ?? room[key] ?? null;
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
