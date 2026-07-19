type CommercialPlanForm = {
  nextBillingAt: string;
  isFeatured: boolean;
  isActive: boolean;
};

type Props<T extends CommercialPlanForm> = {
  form: T;
  onChange: (form: T) => void;
};

const fieldClassName =
  'w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent';

export default function CommercialPlanFields<T extends CommercialPlanForm>({
  form,
  onChange,
}: Props<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
        Plan y estado
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Próxima facturación
          </label>
          <input
            type="datetime-local"
            value={form.nextBillingAt}
            onChange={(event) => onChange({ ...form, nextBillingAt: event.target.value })}
            className={fieldClassName}
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => onChange({ ...form, isFeatured: event.target.checked })}
              className="rounded text-purple-600 focus:ring-purple-600"
            />
            <span className="text-sm font-medium text-slate-700">Destacado</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Habilitado</label>
          <select
            value={form.isActive.toString()}
            onChange={(event) => onChange({ ...form, isActive: event.target.value === 'true' })}
            className={fieldClassName}
          >
            <option value="true">Habilitado</option>
            <option value="false">Deshabilitado</option>
          </select>
        </div>
      </div>
    </div>
  );
}
