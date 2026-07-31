'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { extractCoordinatesFromGoogleMapsUrl, formatCoordinates, normalizeGoogleMapsUrl } from '@/lib/utils/coordinates';

type Amenity = { id: string; name: string; icon?: string | null };
type Plan = 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND';
type PriceKey = 'price1h' | 'price1_5h' | 'price2h' | 'price3h' | 'price12h' | 'price24h' | 'priceNight';
type RoomForm = { name: string; description: string; amenityIds: string[] } & Record<PriceKey, string>;
type LegacyDraft = Partial<typeof initialForm> & {
  id: string; savedAt: string; rooms?: Array<{ name?: string; description?: string; pricePerHour?: string }>;
};

const PRICE_FIELDS: Array<[PriceKey, string]> = [
  ['price1h', '1 h'], ['price1_5h', '1,5 h'], ['price2h', '2 h'], ['price3h', '3 h'],
  ['price12h', '12 h'], ['price24h', '24 h'], ['priceNight', 'Dormida'],
];

const emptyRoom = (): RoomForm => ({
  name: '', description: '', amenityIds: [], price1h: '', price1_5h: '', price2h: '', price3h: '', price12h: '', price24h: '', priceNight: '',
});

const initialForm: { name: string; contactName: string; phone: string; whatsapp: string; instagram: string; email: string; address: string; city: string; googleMapsUrl: string; description: string; plan: Plan } = { name: '', contactName: '', phone: '', whatsapp: '', instagram: '', email: '', address: '', city: '', googleMapsUrl: '', description: '', plan: 'FREE' };

function errorMessage(payload: unknown) {
  const data = payload as { error?: string; details?: Array<{ path?: Array<string | number>; message?: string }> };
  if (!data?.details?.length) return data?.error || 'No se pudo crear el motel.';
  return `${data.error || 'Revisá estos campos'}:\n${data.details.map((detail) => `${detail.path?.join('.') || 'Campo'}: ${detail.message || 'Dato inválido'}`).join('\n')}`;
}

export default function MotelCaptureForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState<RoomForm[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legacyDrafts, setLegacyDrafts] = useState<LegacyDraft[]>([]);
  const coordinates = extractCoordinatesFromGoogleMapsUrl(form.googleMapsUrl);

  useEffect(() => {
    fetch('/api/admin/amenities')
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('No se pudo cargar el catálogo de amenities.')))
      .then((data) => setAmenities(Array.isArray(data) ? data : data.data || []))
      .catch((error: Error) => setAmenitiesError(error.message));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jahatelo_motel_drafts') || '[]');
      if (Array.isArray(saved)) setLegacyDrafts(saved.sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()));
    } catch {
      // Un borrador corrupto no debe impedir usar el formulario.
    }
  }, []);

  const updateRoom = (index: number, patch: Partial<RoomForm>) => setRooms((current) => current.map((room, roomIndex) => roomIndex === index ? { ...room, ...patch } : room));
  const toggleAmenity = (index: number, amenityId: string) => {
    const selected = rooms[index].amenityIds;
    updateRoom(index, { amenityIds: selected.includes(amenityId) ? selected.filter((id) => id !== amenityId) : [...selected, amenityId] });
  };
  const restoreLegacyDraft = (draft: LegacyDraft) => {
    const plan: Plan = ['FREE', 'BASIC', 'GOLD', 'DIAMOND'].includes(draft.plan || '') ? draft.plan as Plan : 'FREE';
    setForm({ ...initialForm, ...draft, plan });
    setRooms((draft.rooms || []).filter((room) => room.name?.trim()).map((room) => ({ ...emptyRoom(), name: room.name || '', description: room.description || '', price1h: room.pricePerHour || '' })));
    setSubmitError('Borrador recuperado. Verificá los datos y reasigná los amenities desde el catálogo antes de guardar.');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/motels/from-form', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, googleMapsUrl: form.googleMapsUrl ? normalizeGoogleMapsUrl(form.googleMapsUrl) : '', rooms }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      router.push(`/admin/motels/${payload.motel.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo crear el motel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 p-6">
    <header>
      <h1 className="text-2xl font-bold text-slate-900">Alta de motel</h1>
      <p className="mt-1 text-sm text-slate-600">Cargá lo esencial ahora. Podrás completar fotos, promos, menú y demás datos desde la edición del motel.</p>
    </header>
    {submitError && <pre className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</pre>}

    {legacyDrafts.length > 0 && <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-amber-900">Borradores anteriores encontrados</h2>
      <p className="mt-1 text-sm text-amber-800">Estaban guardados solo en este navegador. Podés recuperarlos y completar los amenities con el catálogo actual.</p>
      <div className="mt-3 space-y-2">{legacyDrafts.map((draft) => <div key={draft.id} className="flex items-center justify-between rounded-lg bg-white p-3 text-sm"><span><strong>{draft.name || 'Sin nombre'}</strong>{draft.savedAt && ` · ${new Date(draft.savedAt).toLocaleString('es-PY')}`}</span><button type="button" onClick={() => restoreLegacyDraft(draft)} className="rounded-md border border-amber-300 px-3 py-1.5 font-medium text-amber-900">Recuperar</button></div>)}</div>
    </section>}

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos básicos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre del motel *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
        <Field label="Plan *"><select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as typeof form.plan })} className={inputClass}><option value="FREE">FREE</option><option value="BASIC">BASIC</option><option value="GOLD">GOLD</option><option value="DIAMOND">DIAMOND</option></select></Field>
        <Field label="Teléfono"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} /></Field>
        <Field label="Contacto"><input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
      </div>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Ubicación</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ciudad"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></Field>
        <Field label="Dirección"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></Field>
      </div>
      <Field label="Link o iframe de Google Maps" extra="Opcional al crear; si lo pegás, se guardan las coordenadas."><input value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} className={inputClass} placeholder="Pegá el link o iframe de Google Maps" /></Field>
      {form.googleMapsUrl && <p className={`mt-2 text-sm ${coordinates ? 'text-emerald-700' : 'text-amber-700'}`}>{coordinates ? `Coordenadas: ${formatCoordinates(coordinates.lat, coordinates.lng)}` : 'No se pudieron leer las coordenadas; podés guardar y corregirlo luego.'}</p>}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Field label="Descripción"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} placeholder="Opcional; se puede completar luego." /></Field></section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Habitaciones iniciales</h2><p className="text-sm text-slate-600">Opcional. Podés crear el motel vacío y cargar todo luego desde su edición.</p></div><button type="button" onClick={() => setRooms((current) => [...current, emptyRoom()])} className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white">Agregar habitación</button></div>
      {rooms.map((room, index) => <article key={index} className="mb-4 rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex justify-between"><h3 className="font-medium">Habitación {index + 1}</h3><button type="button" onClick={() => setRooms((current) => current.filter((_, roomIndex) => roomIndex !== index))} className="text-sm text-red-600">Eliminar</button></div>
        <div className="grid gap-3 md:grid-cols-2"><Field label="Nombre *"><input required value={room.name} onChange={(e) => updateRoom(index, { name: e.target.value })} className={inputClass} /></Field><Field label="Descripción"><input value={room.description} onChange={(e) => updateRoom(index, { description: e.target.value })} className={inputClass} /></Field></div>
        <p className="mb-2 mt-4 text-sm font-medium text-slate-700">Precios por franja horaria</p><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{PRICE_FIELDS.map(([key, label]) => <Field key={key} label={label}><input type="number" min="0" value={room[key]} onChange={(e) => updateRoom(index, { [key]: e.target.value })} className={inputClass} placeholder="Gs." /></Field>)}</div>
        <p className="mb-2 mt-4 text-sm font-medium text-slate-700">Amenities del catálogo</p>{amenitiesError ? <p className="text-sm text-red-600">{amenitiesError}</p> : <div className="grid grid-cols-2 gap-2 md:grid-cols-3">{amenities.map((amenity) => <label key={amenity.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={room.amenityIds.includes(amenity.id)} onChange={() => toggleAmenity(index, amenity.id)} />{amenity.name}</label>)}</div>}
      </article>)}
    </section>
    <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white/95 py-4 backdrop-blur"><button disabled={isSubmitting} className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white disabled:opacity-60">{isSubmitting ? 'Guardando…' : 'Crear motel y continuar edición'}</button></div>
  </form>;
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600';
function Field({ label, extra, children }: { label: string; extra?: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700"><span className="mb-1.5 block">{label}</span>{children}{extra && <span className="mt-1 block text-xs font-normal text-slate-500">{extra}</span>}</label>; }
