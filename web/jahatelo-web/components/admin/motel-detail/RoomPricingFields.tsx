import { useState } from 'react';
import type { WeekdayRateForm } from './types';

type Props = {
  weekdayRateRules: WeekdayRateForm[];
  onWeekdayRateRulesChange: (rules: WeekdayRateForm[]) => void;
};

export default function RoomPricingFields({ weekdayRateRules, onWeekdayRateRulesChange }: Props) {
  return <SpecificDayRates rules={weekdayRateRules} onChange={onWeekdayRateRulesChange} />;
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
  const availableDays = DAYS.map(([day]) => day).filter((day) => !isReserved(day));
  const allAvailableDaysSelected = availableDays.length > 0 && availableDays.every((day) => draft.weekdays.includes(day));
  const toggleAllDays = () => {
    setRuleError('');
    setDraft((current) => ({
      ...current,
      weekdays: allAvailableDaysSelected
        ? current.weekdays.filter((day) => isReserved(day))
        : availableDays,
    }));
  };
  return <section className="border-t border-slate-200 pt-4">
    <h4 className="mb-1 text-sm font-semibold text-slate-900">Precios por tiempo</h4>
    <p className="mb-3 text-xs text-slate-500">Elegí los días, una duración y el precio. Usá “Todos” para aplicar la misma tarifa toda la semana. Ej.: Vie, Sáb y Dom · Dormida · Gs. 214.000.</p>
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleAllDays}
          disabled={availableDays.length === 0}
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${availableDays.length === 0 ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : allAvailableDaysSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-violet-300 bg-white text-violet-700 hover:border-violet-500 hover:bg-violet-100'}`}
        >
          Todos
        </button>
        {DAYS.map(([day, label]) => {
          const reserved = isReserved(day);
          return <label key={day} title={reserved ? 'Ya existe un precio para este día y duración' : undefined} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${reserved ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : draft.weekdays.includes(day) ? 'cursor-pointer border-violet-600 bg-violet-600 text-white' : 'cursor-pointer border-slate-300 bg-white text-slate-600'}`}><input className="sr-only" type="checkbox" disabled={reserved} checked={draft.weekdays.includes(day)} onChange={() => toggleDay(day)} />{label}</label>;
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select value={draft.duration} onChange={(event) => { setDraft((current) => ({ ...current, duration: event.target.value as WeekdayRateForm['duration'] })); setRuleError(''); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{DURATIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <input type="number" min="1" value={draft.price} onChange={(event) => { setDraft({ ...draft, price: event.target.value }); setRuleError(''); }} placeholder="Precio en Gs." className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addRule} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">Agregar</button>
      </div>
      {ruleError && <p className="mt-2 text-xs font-medium text-red-600">{ruleError}</p>}
    </div>
    {rules.length > 0 && <div className="mt-3 space-y-2">{rules.map((rule, index) => <div key={`${rule.duration}-${rule.price}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><span><strong>{sortDays(rule.weekdays).map((day) => DAYS.find(([value]) => value === day)?.[1]).join(', ')}</strong> · {DURATIONS.find(([value]) => value === rule.duration)?.[1]} · Gs. {Number(rule.price).toLocaleString('es-PY')}</span><button type="button" onClick={() => onChange(rules.filter((_, ruleIndex) => ruleIndex !== index))} className="text-xs font-semibold text-red-600 hover:text-red-700">Eliminar</button></div>)}</div>}
  </section>;
}
