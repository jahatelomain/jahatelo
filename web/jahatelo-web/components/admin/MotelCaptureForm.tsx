'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractCoordinatesFromGoogleMapsUrl, formatCoordinates, normalizeGoogleMapsUrl } from '@/lib/utils/coordinates';
import LocationSelectFields from '@/components/admin/LocationSelectFields';

type Amenity = { id: string; name: string; icon?: string | null };
type Plan = 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND';
type PriceKey = 'price1h' | 'price1_5h' | 'price2h' | 'price3h' | 'price12h' | 'price24h' | 'priceNight';
type RoomForm = { name: string; description: string; amenityIds: string[] } & Record<PriceKey, string>;

const PRICE_FIELDS: Array<[PriceKey, string]> = [
  ['price1h', '1 h'], ['price1_5h', '1,5 h'], ['price2h', '2 h'], ['price3h', '3 h'],
  ['price12h', '12 h'], ['price24h', '24 h'], ['priceNight', 'Dormida'],
];

const emptyRoom = (): RoomForm => ({
  name: '', description: '', amenityIds: [], price1h: '', price1_5h: '', price2h: '', price3h: '', price12h: '', price24h: '', priceNight: '',
});

const initialForm: { name: string; contactName: string; phone: string; whatsapp: string; instagram: string; email: string; address: string; country: string; city: string; googleMapsUrl: string; description: string; plan: Plan } = { name: '', contactName: '', phone: '', whatsapp: '', instagram: '', email: '', address: '', country: '', city: '', googleMapsUrl: '', description: '', plan: 'FREE' };

function errorMessage(payload: unknown) {
  const data = payload as { error?: string; details?: Array<{ path?: Array<string | number>; message?: string }> };
  if (!data?.details?.length) return data?.error || 'No se pudo crear el motel.';
  return `${data.error || 'Revisá estos campos'}:\n${data.details.map((detail) => `${detail.path?.join('.') || 'Campo'}: ${detail.message || 'Dato inválido'}`).join('\n')}`;
}

export default function MotelCaptureForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prospectId = searchParams.get('prospectId');
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState<RoomForm[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prospectError, setProspectError] = useState('');
  const coordinates = extractCoordinatesFromGoogleMapsUrl(form.googleMapsUrl);

  useEffect(() => {
    if (!prospectId) return;
    fetch(`/api/admin/prospects/${prospectId}`)
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('No se pudo cargar el prospecto.')))
      .then((prospect) => setForm((current) => ({
        ...current,
        name: prospect.motelName || current.name,
        contactName: prospect.contactName || current.contactName,
        phone: prospect.phone || current.phone,
        whatsapp: prospect.phone || current.whatsapp,
        email: prospect.email || current.email,
        plan: 'FREE',
      })))
      .catch((error: Error) => setProspectError(error.message));
  }, [prospectId]);

  useEffect(() => {
    fetch('/api/admin/amenities')
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('No se pudo cargar el catálogo de amenities.')))
      .then((data) => setAmenities(Array.isArray(data) ? data : data.data || []))
      .catch((error: Error) => setAmenitiesError(error.message));
  }, []);

  const updateRoom = (index: number, patch: Partial<RoomForm>) => setRooms((current) => current.map((room, roomIndex) => roomIndex === index ? { ...room, ...patch } : room));
  const toggleAmenity = (index: number, amenityId: string) => {
    const selected = rooms[index].amenityIds;
    updateRoom(index, { amenityIds: selected.includes(amenityId) ? selected.filter((id) => id !== amenityId) : [...selected, amenityId] });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/motels/from-form', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, prospectId: prospectId || undefined, googleMapsUrl: form.googleMapsUrl ? normalizeGoogleMapsUrl(form.googleMapsUrl) : '', rooms }),
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
      {prospectId && <p className="mt-2 rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-800">Alta desde prospecto: completá los campos obligatorios para crear el motel.</p>}
    </header>
    {prospectError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{prospectError}</p>}
    {submitError && <pre className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</pre>}

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Datos básicos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre del motel *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
        <Field label="Plan *"><select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as typeof form.plan })} className={inputClass}><option value="FREE">FREE</option><option value="BASIC">BASIC</option><option value="GOLD">GOLD</option><option value="DIAMOND">DIAMOND</option></select></Field>
        <Field label={`Teléfono${prospectId ? ' *' : ''}`}><input required={Boolean(prospectId)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} /></Field>
        <Field label="Contacto"><input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
      </div>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Ubicación</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <LocationSelectFields country={form.country} city={form.city} onChange={(next) => setForm({ ...form, ...next })} className={inputClass} />
        <Field label={`Dirección${prospectId ? ' *' : ''}`}><input required={Boolean(prospectId)} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></Field>
      </div>
      <Field label={`Link o iframe de Google Maps${prospectId ? ' *' : ''}`} extra={prospectId ? 'Obligatorio al convertir un prospecto; se guardan las coordenadas.' : 'Opcional al crear; si lo pegás, se guardan las coordenadas.'}><input required={Boolean(prospectId)} value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} className={inputClass} placeholder="Pegá el link o iframe de Google Maps" /></Field>
      {form.googleMapsUrl && <p className={`mt-2 text-sm ${coordinates ? 'text-emerald-700' : 'text-amber-700'}`}>{coordinates ? `Coordenadas: ${formatCoordinates(coordinates.lat, coordinates.lng)}` : 'No se pudieron leer las coordenadas; podés guardar y corregirlo luego.'}</p>}
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Field label="Slogan"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} placeholder="Opcional; se puede completar luego." /></Field></section>

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
