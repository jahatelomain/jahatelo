import type { Amenity } from './types';

type Form = {
  maxPersons: string;
  hasJacuzzi: boolean;
  isFeatured: boolean;
  amenityIds: string[];
};

type Props<T extends Form> = {
  form: T;
  amenities: Amenity[];
  onChange: (form: T) => void;
};

export default function RoomFeatureFields<T extends Form>({ form, amenities, onChange }: Props<T>) {
  const toggleAmenity = (amenityId: string) => {
    const amenityIds = form.amenityIds.includes(amenityId)
      ? form.amenityIds.filter((id) => id !== amenityId)
      : [...form.amenityIds, amenityId];
    onChange({ ...form, amenityIds });
  };

  return (
    <>
      <section className="border-t border-slate-200 pt-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Características</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Capacidad Máxima</label><input type="number" value={form.maxPersons} onChange={(event) => onChange({ ...form, maxPersons: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="Número de personas" /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <CheckField checked={form.hasJacuzzi} label="🛁 Jacuzzi" onChange={(hasJacuzzi) => onChange({ ...form, hasJacuzzi })} />
          <CheckField checked={form.isFeatured} label="⭐ Destacada" onChange={(isFeatured) => onChange({ ...form, isFeatured })} />
        </div>
      </section>
      <section className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Amenities</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {amenities.map((amenity) => <CheckField key={amenity.id} checked={form.amenityIds.includes(amenity.id)} label={amenity.name} onChange={() => toggleAmenity(amenity.id)} />)}
        </div>
      </section>
    </>
  );
}

function CheckField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="rounded text-purple-600 focus:ring-purple-600" /><span className="text-sm text-slate-700">{label}</span></label>;
}
