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

const WEEKDAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié', THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
};
const DURATION_LABELS: Record<string, string> = {
  H1: '1 h', H1_5: '1,5 h', H2: '2 h', H3: '3 h', H12: '12 h', H24: '24 h', NIGHT: 'Dormida',
};

type RateItem = { field: keyof RoomType; label: string; value: number };

function RatesGrid({ items }: { items: RateItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ field, label, value }) => (
        <div key={field} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-0.5 text-xs text-slate-500">{label}</div>
          <div className="font-semibold text-slate-900">Gs. {formatPrice(value)}</div>
        </div>
      ))}
    </div>
  );
}

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
  const specificRates = Array.from(
    (room.weekdayRates ?? []).reduce((groups, rate) => {
      const key = `${rate.duration}:${rate.price}`;
      const group = groups.get(key) ?? { duration: rate.duration, price: rate.price, weekdays: [] as string[] };
      group.weekdays.push(rate.weekday);
      groups.set(key, group);
      return groups;
    }, new Map<string, { duration: string; price: number; weekdays: string[] }>()),
  ).map(([, rate]) => ({
    ...rate,
    weekdays: rate.weekdays.sort((first, second) => WEEKDAY_ORDER.indexOf(first) - WEEKDAY_ORDER.indexOf(second)),
  })).sort((first, second) => {
    const firstDay = WEEKDAY_ORDER.indexOf(first.weekdays[0] ?? '');
    const secondDay = WEEKDAY_ORDER.indexOf(second.weekdays[0] ?? '');
    return firstDay - secondDay || first.duration.localeCompare(second.duration);
  });

  if (weekdayRates.length === 0 && weekendRates.length === 0 && specificRates.length === 0) return null;

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
      ) : (weekdayRates.length > 0 || weekendRates.length > 0) && <RatesGrid items={weekdayRates.length > 0 ? weekdayRates : weekendRates} />}
      {specificRates.length > 0 && <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
        <p className="mb-2 text-xs font-semibold text-violet-800">Tarifas por día configuradas</p>
        <div className="space-y-1.5">
          {specificRates.map((rate) => <div key={`${rate.duration}-${rate.price}-${rate.weekdays.join('-')}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-slate-700">{rate.weekdays.map((weekday) => WEEKDAY_LABELS[weekday] ?? weekday).join(', ')} · {DURATION_LABELS[rate.duration] ?? rate.duration}</span>
            <span className="font-semibold text-slate-900">Gs. {formatPrice(rate.price)}</span>
          </div>)}
        </div>
      </div>}
    </div>
  );
}
