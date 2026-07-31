import { formatPrice } from './displayUtils';
import type { RoomType } from './types';

const RATE_FIELDS = [
  ['price1h', '1 h'],
  ['price1_5h', '1.5 h'],
  ['price2h', '2 h'],
  ['price3h', '3 h'],
  ['price12h', '12 h'],
  ['price24h', '24 h'],
  ['priceNight', 'Dormida'],
] as const satisfies ReadonlyArray<[keyof RoomType, string]>;

export default function RoomRatesSummary({ room }: { room: RoomType }) {
  const toRates = (source: Pick<RoomType, (typeof RATE_FIELDS)[number][0]>) => RATE_FIELDS.flatMap(([field, label]) => {
    const value = source[field];
    return typeof value === 'number' && value > 0 ? [{ field, label, value }] : [];
  });
  const weekday = room.dayRates?.find((rate) => rate.dayGroup === 'WEEKDAY');
  const weekend = room.dayRates?.find((rate) => rate.dayGroup === 'WEEKEND');
  const rates = toRates(room);
  const weekdayRates = weekday ? toRates({ ...room, ...weekday }) : rates;
  const weekendRates = weekend ? toRates({ ...room, ...weekend }) : rates;
  const hasDayPriceVariation = weekdayRates.some((weekdayRate) =>
    weekendRates.some(
      (weekendRate) => weekdayRate.field === weekendRate.field && weekdayRate.value !== weekendRate.value,
    ),
  );

  if (weekdayRates.length === 0 && weekendRates.length === 0) return null;

  const RatesGrid = ({ items }: { items: typeof rates }) => (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ field, label, value }) => (
        <div key={field} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-0.5 text-xs text-slate-500">{label}</div>
          <div className="font-semibold text-slate-900">Gs. {formatPrice(value)}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Precios publicados</h4>
      {hasDayPriceVariation ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-blue-700">Dom – Jue</p>
            <RatesGrid items={weekdayRates} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-orange-700">Vie – Sáb</p>
            <RatesGrid items={weekendRates} />
          </div>
        </div>
      ) : <RatesGrid items={weekdayRates.length > 0 ? weekdayRates : weekendRates} />}
    </div>
  );
}
