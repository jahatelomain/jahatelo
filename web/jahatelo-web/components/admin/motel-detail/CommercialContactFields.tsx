type CommercialContactForm = {
  adminContactName: string;
  adminContactPhone: string;
  adminContactEmail: string;
  operationsContactName: string;
  operationsContactPhone: string;
  operationsContactEmail: string;
};

type Props<T extends CommercialContactForm> = {
  form: T;
  onChange: (form: T) => void;
};

const inputClassName =
  'w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent';

export default function CommercialContactFields<T extends CommercialContactForm>({
  form,
  onChange,
}: Props<T>) {
  const renderContact = (
    label: string,
    prefix: 'adminContact' | 'operationsContact',
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={form[`${prefix}Name`]}
        onChange={(event) => onChange({ ...form, [`${prefix}Name`]: event.target.value })}
        className={inputClassName}
        placeholder="Nombre"
      />
      <input
        type="text"
        value={form[`${prefix}Phone`]}
        onChange={(event) => onChange({ ...form, [`${prefix}Phone`]: event.target.value })}
        className={inputClassName}
        placeholder="Teléfono"
      />
      <input
        type="email"
        value={form[`${prefix}Email`]}
        onChange={(event) => onChange({ ...form, [`${prefix}Email`]: event.target.value })}
        className={inputClassName}
        placeholder="Correo"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
        Contactos
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {renderContact('Contacto administrativo', 'adminContact')}
        {renderContact('Contacto operativo', 'operationsContact')}
      </div>
    </div>
  );
}
