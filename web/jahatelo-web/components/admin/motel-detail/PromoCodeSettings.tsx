import { createInitialPromoForm } from './formDefaults';

type PromoForm = ReturnType<typeof createInitialPromoForm>;

export default function PromoCodeSettings({ form, onChange }: { form: PromoForm; onChange: (form: PromoForm) => void }) {
  return (
    <div className="space-y-3 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="text-sm font-semibold text-slate-800">Código Promocional</span>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={form.hasPromoCode} onChange={(event) => onChange({ ...form, hasPromoCode: event.target.checked })} className="peer sr-only" />
          <div className="peer h-6 w-10 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-4 peer-focus:ring-2 peer-focus:ring-purple-400" />
          <span className="ml-2 text-sm font-medium text-slate-700">{form.hasPromoCode ? 'Activado' : 'Desactivado'}</span>
        </label>
      </div>
      {form.hasPromoCode && (
        <div className="space-y-3 border-t border-purple-100 pt-2">
          <p className="rounded-lg bg-purple-100 px-3 py-2 text-xs text-purple-700">Los usuarios podrán reclamar un código desde la app y la web y presentarlo en el motel.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">¿Cada cuánto puede reclamar un usuario?</label>
            <select value={form.codeRepeatRule} onChange={(event) => onChange({ ...form, codeRepeatRule: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600">
              <option value="NEVER">Una sola vez por persona</option><option value="DAILY">Una vez por día</option><option value="WEEKLY">Una vez por semana</option><option value="MONTHLY">Una vez por mes</option>
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-slate-700">Límite total de códigos</label><input type="number" min={1} value={form.codeLimit} onChange={(event) => onChange({ ...form, codeLimit: event.target.value })} placeholder="Sin tope" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600" /></div>
            <div className="flex-1"><label className="mb-1 block text-sm font-medium text-slate-700">Período del límite</label><select value={form.codeLimitPeriod} onChange={(event) => onChange({ ...form, codeLimitPeriod: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"><option value="UNLIMITED">Sin tope</option><option value="WEEKLY">Por semana</option><option value="MONTHLY">Por mes</option></select></div>
          </div>
        </div>
      )}
    </div>
  );
}
