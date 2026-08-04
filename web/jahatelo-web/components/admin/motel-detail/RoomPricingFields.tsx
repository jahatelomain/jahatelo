import { useState } from 'react';
import type { DayRateForm, WeekdayRateForm } from './types';

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
  weekdayRateRules: WeekdayRateForm[];
  onWeekdayRateRulesChange: (rules: WeekdayRateForm[]) => void;
};

export default function RoomPricingFields({ basePrices, weekdayRates, weekendRates, onBaseChange, onWeekdayChange, onWeekendChange, weekdayRateRules, onWeekdayRateRulesChange }: Props) {
  return (
    <>
      <section className="border-t border-slate-200 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Precios por Tiempo</h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ROOM_PRICE_FIELDS.map(([field, label]) => <PriceInput key={field} label={label} value={basePrices[field]} onChange={(value) => onBaseChange(field, value)} />)}
        </div>
      </section>
      <SpecificDayRates rules={weekdayRateRules} onChange={onWeekdayRateRulesChange} />
    </>
  );
}

const DAYS: Array<[WeekdayRateForm['weekdays'][number], string]> = [
  ['MONDAY', 'Lun'], ['TUESDAY', 'Mar'], ['WEDNESDAY', 'Mié'], ['THURSDAY', 'Jue'], ['FRIDAY', 'Vie'], ['SATURDAY', 'Sáb'], ['SUNDAY', 'Dom'],
];
const DURATIONS: Array<[WeekdayRateForm['duration'], string]> = [
  ['H1', '1 h'], ['H1_5', '1,5 h'], ['H2', '2 h'], ['H3', '3 h'], ['H12', '12 h'], ['H24', '24 h'], ['NIGHT', 'Dormida'],
];

function SpecificDayRates({ rules, onChange }: { rules: WeekdayRateForm[]; onChange: (rules: WeekdayRateForm[]) => void }) {
  const [draft, setDraft] = useState<WeekdayRateForm>({ weekdays: [], duration: 'NIGHT', price: '' });
  const [ruleError, setRuleError] = useState('');
  const sortDays = (days: WeekdayRateForm['weekdays']) => [...days].sort(
    (first, second) => DAYS.findIndex(([value]) => value === first) - DAYS.findIndex(([value]) => value === second),
  );
  const isReserved = (day: WeekdayRateForm['weekdays'][number]) => rules.some(
    (rule) => rule.duration === draft.duration && rule.weekdays.includes(day),
  );
  const addRule = () => {
    if (draft.weekdays.length === 0 || !Number.isInteger(Number(draft.price)) || Number(draft.price) <= 0) {
      setRuleError('Elegí al menos un día e ingresá un precio entero mayor a cero.');
      return;
    }
    const duplicatedDays = draft.weekdays.filter(isReserved);
    if (duplicatedDays.length > 0) {
      setRuleError('Un mismo día no puede tener dos precios para la misma duración.');
      return;
    }
    onChange([...rules, { ...draft, weekdays: sortDays(draft.weekdays) }]);
    setDraft({ weekdays: [], duration: 'NIGHT', price: '' });
    setRuleError('');
  };
  const toggleDay = (day: WeekdayRateForm['weekdays'][number]) => {
    if (isReserved(day)) return;
    setRuleError('');
    setDraft((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day) ? current.weekdays.filter((value) => value !== day) : [...current.weekdays, day],
    }));
  };
  return <section className="border-t border-slate-200 pt-4">
    <h4 className="mb-1 text-sm font-semibold text-slate-900">Tarifas por días específicos</h4>
    <p className="mb-3 text-xs text-slate-500">Elegí los días, una duración y el precio. Ej.: Vie, Sáb y Dom · Dormida · Gs. 214.000.</p>
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        {DAYS.map(([day, label]) => {
          const reserved = isReserved(day);
          return <label key={day} title={reserved ? 'Ya existe un precio para este día y duración' : undefined} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${reserved ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : draft.weekdays.includes(day) ? 'cursor-pointer border-violet-600 bg-violet-600 text-white' : 'cursor-pointer border-slate-300 bg-white text-slate-600'}`}><input className="sr-only" type="checkbox" disabled={reserved} checked={draft.weekdays.includes(day)} onChange={() => toggleDay(day)} />{label}</label>;
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select value={draft.duration} onChange={(event) => { setDraft({ ...draft, duration: event.target.value as WeekdayRateForm['duration'], weekdays: [] }); setRuleError(''); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{DURATIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <input type="number" min="1" value={draft.price} onChange={(event) => { setDraft({ ...draft, price: event.target.value }); setRuleError(''); }} placeholder="Precio en Gs." className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addRule} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">Agregar</button>
      </div>
      {ruleError && <p className="mt-2 text-xs font-medium text-red-600">{ruleError}</p>}
    </div>
    {rules.length > 0 && <div className="mt-3 space-y-2">{rules.map((rule, index) => <div key={`${rule.duration}-${rule.price}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><span><strong>{sortDays(rule.weekdays).map((day) => DAYS.find(([value]) => value === day)?.[1]).join(', ')}</strong> · {DURATIONS.find(([value]) => value === rule.duration)?.[1]} · Gs. {Number(rule.price).toLocaleString('es-PY')}</span><button type="button" onClick={() => onChange(rules.filter((_, ruleIndex) => ruleIndex !== index))} className="text-xs font-semibold text-red-600 hover:text-red-700">Eliminar</button></div>)}</div>}
  </section>;
}

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label><input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="Gs." /></div>;
}
