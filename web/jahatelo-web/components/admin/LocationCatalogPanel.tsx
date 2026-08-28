'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Check, Globe2, Loader2, MapPin, Plus, Power, RotateCcw, Trash2 } from 'lucide-react';
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
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetch('/api/admin/locations');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo.');
      setCountries(data.countries || []);
      setCountryId((current) => current || data.countries?.[0]?.id || '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const cities = countries.flatMap((country) => country.cities);
    return {
      activeCountries: countries.filter((country) => country.isActive).length,
      activeCities: cities.filter((city) => city.isActive).length,
    };
  }, [countries]);

  const update = async (payload: Record<string, unknown>, pendingKey: string) => {
    setSaving(pendingKey);
    try {
      const response = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
      await load(false);
    } finally {
      setSaving(null);
    }
  };

  const createCountry = async (event: FormEvent) => {
    event.preventDefault();
    const name = countryName.trim();
    if (!name || saving) return;
    try {
      await update({ action: 'createCountry', name }, 'new-country');
      setCountryName('');
      toast.success('País agregado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar el país.');
    }
  };

  const createCity = async (event: FormEvent) => {
    event.preventDefault();
    const name = cityName.trim();
    if (!name || !countryId || saving) return;
    try {
      await update({ action: 'createCity', countryId, name }, 'new-city');
      setCityName('');
      toast.success('Ciudad agregada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar la ciudad.');
    }
  };

  const toggle = async (action: 'setCountryActive' | 'setCityActive', id: string, isActive: boolean) => {
    if (saving) return;
    try {
      await update({ action, id, isActive: !isActive }, id);
      toast.success(!isActive ? 'Ubicación activada.' : 'Ubicación desactivada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar.');
    }
  };

  const deleteCountry = async (country: Country) => {
    if (saving || country.cities.length > 0) return;
    const confirmed = window.confirm(
      `¿Eliminar definitivamente “${country.name}”? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    try {
      await update({ action: 'deleteCountry', id: country.id }, `delete-${country.id}`);
      if (countryId === country.id) {
        setCountryId(countries.find((item) => item.id !== country.id)?.id || '');
      }
      toast.success(`${country.name} fue eliminado.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el país.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <Loader2 className="mr-2 animate-spin" size={18} /> Cargando ubicaciones…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Globe2 size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Países y ciudades</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Administrá las ubicaciones disponibles en formularios, filtros y perfiles de moteles. Las ubicaciones en uso se desactivan para conservar su historial.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600"><strong className="text-slate-900">{stats.activeCountries}</strong> países activos</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600"><strong className="text-slate-900">{stats.activeCities}</strong> ciudades activas</span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createCountry} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Globe2 size={18} /></span>
            <div><h3 className="font-semibold text-slate-900">Agregar un país</h3><p className="text-xs text-slate-500">No distingue mayúsculas, acentos ni espacios extra.</p></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={countryName} onChange={(event) => setCountryName(event.target.value)} placeholder="Ej. Argentina" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            <button type="submit" disabled={!countryName.trim() || Boolean(saving)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-45">
              {saving === 'new-country' ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Agregar país
            </button>
          </div>
        </form>

        <form onSubmit={createCity} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Building2 size={18} /></span>
            <div><h3 className="font-semibold text-slate-900">Agregar una ciudad</h3><p className="text-xs text-slate-500">Seleccioná primero el país al que pertenece.</p></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(130px,0.7fr)_minmax(150px,1fr)_auto]">
            <select value={countryId} onChange={(event) => setCountryId(event.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100">
              <option value="" disabled>Seleccionar país</option>
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </select>
            <input value={cityName} onChange={(event) => setCityName(event.target.value)} placeholder="Ej. Asunción" className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            <button type="submit" disabled={!cityName.trim() || !countryId || Boolean(saving)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-45">
              {saving === 'new-city' ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Agregar
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {countries.map((country) => {
          const activeCities = country.cities.filter((city) => city.isActive).length;
          return (
            <section key={country.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${country.isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${country.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {country.isActive ? <Check size={17} /> : <Power size={16} />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{country.name}</h3>
                    <p className="text-xs text-slate-500">{activeCities} de {country.cities.length} ciudades activas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {country.cities.length === 0 && (
                    <button type="button" onClick={() => void deleteCountry(country)} disabled={Boolean(saving)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-45" title={`Eliminar ${country.name}`} aria-label={`Eliminar ${country.name}`}>
                      {saving === `delete-${country.id}` ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                    </button>
                  )}
                  <button type="button" onClick={() => void toggle('setCountryActive', country.id, country.isActive)} disabled={Boolean(saving)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:opacity-45 ${country.isActive ? 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {saving === country.id ? <Loader2 className="animate-spin" size={15} /> : country.isActive ? <Power size={15} /> : <RotateCcw size={15} />}
                    {country.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>

              <div className="p-5">
                {country.cities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {country.cities.map((city) => (
                      <div key={city.id} className={`group inline-flex items-center gap-2 rounded-xl border py-1.5 pl-3 pr-1.5 text-sm transition ${city.isActive ? 'border-slate-200 bg-white text-slate-700 hover:border-purple-200' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                        <MapPin size={14} className={city.isActive ? 'text-purple-500' : 'text-slate-400'} />
                        <span className={city.isActive ? '' : 'line-through'}>{city.name}</span>
                        <button type="button" onClick={() => void toggle('setCityActive', city.id, city.isActive)} disabled={Boolean(saving)} className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-45 ${city.isActive ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-emerald-600 hover:bg-emerald-100'}`} title={city.isActive ? `Desactivar ${city.name}` : `Activar ${city.name}`} aria-label={city.isActive ? `Desactivar ${city.name}` : `Activar ${city.name}`}>
                          {saving === city.id ? <Loader2 className="animate-spin" size={14} /> : city.isActive ? <Power size={14} /> : <RotateCcw size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">Todavía no hay ciudades cargadas.</div>
                )}
              </div>
            </section>
          );
        })}
        {countries.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-purple-200 bg-purple-50 p-8 text-center text-sm text-purple-800">Agregá el primer país para comenzar a organizar las ciudades.</div>
        )}
      </div>
    </div>
  );
}
