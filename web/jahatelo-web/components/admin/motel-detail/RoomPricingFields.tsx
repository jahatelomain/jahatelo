import type { DayRateForm } from './types';

export const ROOM_PRICE_FIELDS = [
  ['price1h', '1h'], ['price1_5h', '1.5h'], ['price2h', '2h'], ['price3h', '3h'],
  ['price12h', '12h'], ['price24h', '24h'], ['priceNight', 'Dormida'],
] as const;

type PriceKey = (typeof ROOM_PRICE_FIELDS)[number][0];
type BasePrices = Record<PriceKey, string>;

type Props = {
  basePrices: BasePrices;
  weekdayRates: DayRateForm;
  weekendRates: DayRateForm;
  onBaseChange: (field: PriceKey, value: string) => void;
  onWeekdayChange: (rates: DayRateForm) => void;
  onWeekendChange: (rates: DayRateForm) => void;
};

export default function RoomPricingFields({ basePrices, weekdayRates, weekendRates, onBaseChange, onWeekdayChange, onWeekendChange }: Props) {
  return (
    <>
      <section className="border-t border-slate-200 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Precios por Tiempo</h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ROOM_PRICE_FIELDS.map(([field, label]) => <PriceInput key={field} label={label} value={basePrices[field]} onChange={(value) => onBaseChange(field, value)} />)}
        </div>
      </section>
      <section className="border-t border-slate-200 pt-4">
        <h4 className="mb-1 text-sm font-semibold text-slate-900">Precios por Día (opcional)</h4>
        <p className="mb-3 text-xs text-slate-500">Dejá vacío para usar los precios base. Si se llenan, sobreescriben los precios base según el día.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <DayRateGroup title="Dom – Jue (Semana)" tone="blue" rates={weekdayRates} onChange={onWeekdayChange} />
          <DayRateGroup title="Vie – Sáb (Fin de semana)" tone="orange" rates={weekendRates} onChange={onWeekendChange} />
        </div>
      </section>
    </>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label><input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="Gs." /></div>;
}

function DayRateGroup({ title, tone, rates, onChange }: { title: string; tone: 'blue' | 'orange'; rates: DayRateForm; onChange: (rates: DayRateForm) => void }) {
  const containerClass = tone === 'blue' ? 'border-blue-100 bg-blue-50/40' : 'border-orange-100 bg-orange-50/40';
  const titleClass = tone === 'blue' ? 'text-blue-700' : 'text-orange-700';
  const focusClass = tone === 'blue' ? 'focus:ring-blue-400' : 'focus:ring-orange-400';
  return (
    <div className={`rounded-lg border p-3 ${containerClass}`}>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${titleClass}`}>{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {ROOM_PRICE_FIELDS.map(([field, label]) => <div key={field}><label className="mb-1 block text-xs text-slate-500">{label}</label><input type="number" value={rates[field]} onChange={(event) => onChange({ ...rates, [field]: event.target.value })} className={`w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-transparent focus:ring-2 ${focusClass}`} placeholder="Gs." /></div>)}
      </div>
    </div>
  );
}
