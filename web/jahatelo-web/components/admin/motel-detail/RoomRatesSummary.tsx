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
  const rates = RATE_FIELDS.flatMap(([field, label]) => {
    const value = room[field];
    return typeof value === 'number' && value > 0 ? [{ field, label, value }] : [];
  });

  if (rates.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Precios</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rates.map(({ field, label, value }) => (
          <div key={field} className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
            <div className="text-xs text-slate-500 mb-0.5">{label}</div>
            <div className="font-semibold text-slate-900">Gs. {formatPrice(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
