'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

type City = { id: string; name: string; isActive: boolean };
type Country = { id: string; name: string; isActive: boolean; cities: City[] };

export default function LocationCatalogPanel() {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryName, setCountryName] = useState('');
  const [cityName, setCityName] = useState('');
  const [countryId, setCountryId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/locations');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo.');
      setCountries(data.countries || []);
      setCountryId((current) => current || data.countries?.[0]?.id || '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const update = async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/admin/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
    await load();
  };

  const createCountry = async () => {
    if (!countryName.trim()) return;
    try { await update({ action: 'createCountry', name: countryName }); setCountryName(''); toast.success('País agregado.'); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo agregar el país.'); }
  };
  const createCity = async () => {
    if (!cityName.trim() || !countryId) return;
    try { await update({ action: 'createCity', countryId, name: cityName }); setCityName(''); toast.success('Ciudad agregada.'); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo agregar la ciudad.'); }
  };
  const toggle = async (action: 'setCountryActive' | 'setCityActive', id: string, isActive: boolean) => {
    try { await update({ action, id, isActive: !isActive }); toast.success(!isActive ? 'Ubicación activada.' : 'Ubicación desactivada.'); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar.'); }
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Cargando países y ciudades…</div>;
  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div><h2 className="text-xl font-semibold text-slate-900">Países y ciudades</h2><p className="mt-1 text-sm text-slate-600">El catálogo evita duplicados aunque cambien mayúsculas, espacios o acentos. Las ubicaciones en uso se desactivan, no se eliminan.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex gap-2"><input value={countryName} onChange={(event) => setCountryName(event.target.value)} placeholder="Nuevo país" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><button type="button" onClick={createCountry} className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white">Agregar</button></div>
        <div className="flex gap-2"><select value={countryId} onChange={(event) => setCountryId(event.target.value)} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2">{countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}</select><input value={cityName} onChange={(event) => setCityName(event.target.value)} placeholder="Nueva ciudad" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" /><button type="button" onClick={createCity} className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white">Agregar</button></div>
      </div>
      <div className="space-y-3">
        {countries.map((country) => <section key={country.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{country.name}</h3><button type="button" onClick={() => toggle('setCountryActive', country.id, country.isActive)} className="text-sm font-medium text-purple-700">{country.isActive ? 'Desactivar' : 'Activar'}</button></div><div className="mt-3 flex flex-wrap gap-2">{country.cities.map((city) => <span key={city.id} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${city.isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-400 line-through'}`}>{city.name}<button type="button" onClick={() => toggle('setCityActive', city.id, city.isActive)} className="font-medium text-purple-700 no-underline">{city.isActive ? '×' : '↺'}</button></span>)}{country.cities.length === 0 && <p className="text-sm text-slate-500">Sin ciudades.</p>}</div></section>)}
        {countries.length === 0 && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Aún no hay ubicaciones. Agregá el primer país y sus ciudades.</p>}
      </div>
    </div>
  );
}
