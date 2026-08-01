'use client';

import { useEffect, useMemo, useState } from 'react';

type City = { id: string; name: string; isActive: boolean };
type Country = { id: string; name: string; isActive: boolean; cities: City[] };

export default function LocationSelectFields({ country, city, onChange, className, disabled = false }: { country: string; city: string; onChange: (next: { country: string; city: string }) => void; className: string; disabled?: boolean }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/admin/locations').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar ubicaciones.');
      setCountries(data.countries || []);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar ubicaciones.'));
  }, []);
  const activeCountries = useMemo(() => countries.filter((item) => item.isActive || item.name === country), [countries, country]);
  const selectedCountry = countries.find((item) => item.name === country);
  const cities = (selectedCountry?.cities || []).filter((item) => item.isActive || item.name === city);
  return <>
    <div><label className="mb-2 block text-sm font-medium text-slate-700">País</label><select required value={country} disabled={disabled} onChange={(event) => onChange({ country: event.target.value, city: '' })} className={`${className} bg-white disabled:cursor-not-allowed disabled:bg-slate-100`}><option value="">Seleccionar país</option>{activeCountries.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
    <div><label className="mb-2 block text-sm font-medium text-slate-700">Ciudad</label><select required value={city} disabled={disabled || !country} onChange={(event) => onChange({ country, city: event.target.value })} className={`${className} bg-white disabled:cursor-not-allowed disabled:bg-slate-100`}><option value="">{country ? 'Seleccionar ciudad' : 'Primero elegí un país'}</option>{cities.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>{disabled && <p className="mt-1 text-xs text-slate-500">Solo un superadministrador puede modificar esta ubicación.</p>}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>
  </>;
}
