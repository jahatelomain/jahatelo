import LocationSelectFields from '@/components/admin/LocationSelectFields';

type LocationForm = { country: string; city: string; address: string; mapUrl: string };

export default function MotelLocationFields<T extends LocationForm>({ form, onChange, canEditLocation = true }: { form: T; onChange: (form: T) => void; canEditLocation?: boolean }) {
  const inputClass = 'w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600';
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">Ubicación</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <LocationSelectFields country={form.country} city={form.city} onChange={(next) => onChange({ ...form, ...next })} className={inputClass} disabled={!canEditLocation} />
        <Field label="Dirección"><input type="text" value={form.address} disabled={!canEditLocation} onChange={(event) => onChange({ ...form, address: event.target.value })} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`} /></Field>
        <div className="md:col-span-2">
          <Field label="Link o iframe de Google Maps (ubicación exacta)"><input type="text" value={form.mapUrl} disabled={!canEditLocation} onChange={(event) => onChange({ ...form, mapUrl: event.target.value })} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100`} placeholder="https://maps.google.com/..." /></Field>
          <p className="mt-2 text-xs text-slate-500">Al guardar, el sistema obtiene de aquí las coordenadas usadas por la web y las apps.</p>
          {!canEditLocation && <p className="mt-1 text-xs text-slate-500">La ubicación del motel solo puede ser modificada por un superadministrador.</p>}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>{children}</div>;
}
