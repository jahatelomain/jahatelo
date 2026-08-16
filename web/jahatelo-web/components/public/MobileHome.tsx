'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, ChevronDown, LoaderCircle, Map, MapPin, Search, Tag } from 'lucide-react';
import type { PublicMotelListItem } from '@/lib/domain/motels/publicListItem';
import { formatGuaranies } from '@/lib/formatCurrency';
import MotelCard from '@/components/public/MotelCard';
import MotelLogoHeart from '@/components/public/MotelLogoHeart';

export default function MobileHome({ featuredMotels, cities }: { featuredMotels: PublicMotelListItem[]; cities: Array<{ name: string; total: number }> }) {
  const [query, setQuery] = useState('');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [motelsByCity, setMotelsByCity] = useState<Record<string, PublicMotelListItem[]>>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    window.location.assign(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };
  const toggleCity = async (city: { name: string }) => {
    if (expandedCity === city.name) { setExpandedCity(null); return; }
    setExpandedCity(city.name);
    if (motelsByCity[city.name]) return;
    setLoadingCity(city.name);
    try {
      const response = await fetch(`/api/mobile/motels?city=${encodeURIComponent(city.name)}&limit=100`);
      const payload = response.ok ? await response.json() : { data: [] };
      setMotelsByCity((current) => ({ ...current, [city.name]: payload.data || [] }));
    } finally {
      setLoadingCity(null);
    }
  };
  return <main className="bg-slate-50 md:hidden">
    <header className="rounded-b-[32px] bg-purple-600 px-4 pb-5 pt-4 text-white shadow-sm">
      <div className="flex items-center justify-between"><Link href="/nearby" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-800"><MapPin size={16} fill="currentColor" />Cerca mío</Link><button type="button" aria-label="Notificaciones" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800"><Bell size={18} /></button></div>
      <div className="mt-5"><h1 className="text-xl font-bold">¡Hola!</h1><p className="mt-0.5 text-sm text-purple-200">Encontrá tu próximo destino</p></div>
      <form onSubmit={submit} className="mt-4 flex items-center gap-2 rounded-xl bg-white p-1.5 text-slate-700 shadow-sm"><Search className="ml-2 text-slate-400" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar moteles, ciudades o amenities" className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none placeholder:text-slate-400" /><button aria-label="Buscar" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white"><ArrowRight size={17} /></button></form>
    </header>
    <section className="px-4 pb-2 pt-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Destacados</h2><Link href="/search?featured=1" className="text-sm font-semibold text-purple-600">Ver todos</Link></div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">{featuredMotels.map((motel) => <Link key={motel.id} href={`/motels/${motel.slug}`} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-sm"><div className="relative h-32 bg-purple-100">{(motel.featuredPhotoWeb || motel.thumbnail) && <Image src={motel.featuredPhotoWeb || motel.thumbnail || ''} alt={motel.name} fill className="object-cover" sizes="256px" />}{motel.logoUrl && <MotelLogoHeart src={motel.logoUrl} alt={motel.name} scale={motel.logoScale} className="absolute left-3 top-3 h-10 w-12" />}</div><div className="p-3"><p className="truncate font-bold text-slate-900">{motel.name}</p><p className="mt-1 truncate text-xs text-slate-500">{[motel.address, motel.city].filter(Boolean).join(', ')}</p><p className="mt-3 text-sm font-bold text-purple-600">{motel.startingPrice ? `Desde ${formatGuaranies(motel.startingPrice)}` : 'Consultar'}</p></div></Link>)}{featuredMotels.length === 0 && <p className="text-sm text-slate-500">No hay moteles destacados.</p>}</div>
    </section>
    <section className="px-4 py-4"><Link href="/mapa" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><Map size={22} /></span><span className="flex-1"><span className="block font-bold text-slate-900">Ver mapa</span><span className="text-sm text-slate-500">Explorá moteles cerca tuyo</span></span><ArrowRight className="text-purple-600" size={20} /></Link><div className="mt-3 grid grid-cols-2 gap-3"><Link href="/search" className="rounded-2xl bg-white p-4 shadow-sm"><Search className="text-purple-600" size={20} /><span className="mt-3 block font-semibold text-slate-900">Buscar moteles</span></Link><Link href="/search?promos=1" className="rounded-2xl bg-white p-4 shadow-sm"><Tag className="text-purple-600" size={20} /><span className="mt-3 block font-semibold text-slate-900">Promos</span></Link></div></section>
    {cities.length > 0 && <section className="px-4 py-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Moteles por ciudad</h2><Link href="/search" className="text-sm font-semibold text-purple-600">Ver todos</Link></div><div className="space-y-2">{cities.map((city) => { const isExpanded = expandedCity === city.name; const motels = motelsByCity[city.name] || []; return <section key={city.name} className="overflow-hidden rounded-2xl bg-white shadow-sm"><button type="button" onClick={() => void toggleCity(city)} aria-expanded={isExpanded} className="flex w-full items-center gap-3 p-4 text-left"><span className="flex-1"><span className="block font-semibold text-slate-900">{city.name}</span><span className="mt-0.5 block text-xs text-slate-500">{city.total} {city.total === 1 ? 'motel' : 'moteles'}</span></span><ChevronDown className={`text-purple-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} /></button>{isExpanded && <div className="border-t border-slate-100 p-3">{loadingCity === city.name ? <div className="flex items-center justify-center gap-2 py-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={17} />Cargando moteles…</div> : motels.length ? <div className="grid gap-3">{motels.map((motel) => <MotelCard key={motel.id} motel={motel} showFavoriteAction={false} />)}</div> : <p className="py-4 text-center text-sm text-slate-500">No hay moteles publicados en esta ciudad.</p>}</div>}</section>; })}</div></section>}
  </main>;
}
