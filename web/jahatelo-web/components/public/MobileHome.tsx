'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, ChevronDown, LoaderCircle, Map, MapPin, Search, Tag } from 'lucide-react';
import type { PublicMotelListItem } from '@/lib/domain/motels/publicListItem';
import { formatGuaranies } from '@/lib/formatCurrency';
import { PRICE_UPDATING_MESSAGE } from '@/lib/domain/motels/pricePresentation';
import MotelCard from '@/components/public/MotelCard';
import MotelLogoHeart from '@/components/public/MotelLogoHeart';

type City = { name: string; total: number };

function QuickLink({ href, title, subtitle, icon: Icon, tone }: {
  href: string;
  title: string;
  subtitle: string;
  icon: typeof Map;
  tone: 'map' | 'city' | 'promo';
}) {
  const themes = {
    map: 'from-[#11233f] via-[#165674] to-[#18a0aa]',
    city: 'from-[#35154f] via-[#69218d] to-[#aa36ad]',
    promo: 'from-[#54113d] via-[#a42166] to-[#ee6b78]',
  };

  return (
    <Link href={href} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${themes[tone]} p-4 text-white shadow-[0_8px_18px_rgba(42,0,56,0.16)] transition duration-200 active:scale-[0.98]`}>
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border border-white/15" />
      <div className="absolute -bottom-8 right-7 h-20 w-20 rounded-full bg-white/10 blur-sm" />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/18 ring-1 ring-white/25"><Icon size={22} /></span>
        <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="mt-0.5 block text-xs text-white/75">{subtitle}</span></span>
        <ArrowRight size={19} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function MobileHome({ featuredMotels, cities }: { featuredMotels: PublicMotelListItem[]; cities: City[] }) {
  const [query, setQuery] = useState('');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [motelsByCity, setMotelsByCity] = useState<Record<string, PublicMotelListItem[]>>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    window.location.assign(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  const toggleCity = async (city: City) => {
    if (expandedCity === city.name) {
      setExpandedCity(null);
      return;
    }
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

  return (
    <main className="min-h-screen bg-[#f8f5fa] pb-4 md:hidden">
      <header className="rounded-b-[28px] bg-purple-600 px-4 pb-4 pt-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/nearby" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-800"><MapPin size={16} fill="currentColor" />Cerca mío</Link>
          <Link href="/notificaciones" aria-label="Configurar notificaciones" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800"><Bell size={18} /></Link>
        </div>
        <div className="mt-4"><h1 className="text-xl font-bold">¡Hola!</h1><p className="mt-0.5 text-sm text-purple-200">Encontrá tu próximo destino</p></div>
        <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-xl bg-white p-1.5 text-slate-700 shadow-sm">
          <Search className="ml-2 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar moteles, ciudades o amenities" className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none placeholder:text-slate-400" />
          <button aria-label="Buscar" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white"><ArrowRight size={17} /></button>
        </form>
      </header>

      <section className="px-4 pb-1 pt-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Destacados</h2><Link href="/search?featured=1" className="text-sm font-semibold text-purple-600">Ver todos</Link></div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {featuredMotels.map((motel) => (
            <Link key={motel.id} href={`/motels/${motel.slug}`} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-[0_6px_14px_rgba(42,0,56,0.1)] transition duration-200 active:scale-[0.98]">
              <div className="relative h-32 bg-purple-100">{(motel.featuredPhotoWeb || motel.thumbnail) && <Image src={motel.featuredPhotoWeb || motel.thumbnail || ''} alt={motel.name} fill className="object-cover" sizes="256px" />}{motel.logoUrl && <MotelLogoHeart src={motel.logoUrl} alt={motel.name} className="absolute left-3 top-3 h-10 w-12" />}</div>
              <div className="p-3"><p className="truncate font-bold text-slate-900">{motel.name}</p><p className="mt-1 truncate text-xs text-slate-500">{[motel.address, motel.city].filter(Boolean).join(', ')}</p><p className="mt-2 text-sm font-bold text-purple-600">{motel.startingPrice ? `Desde ${formatGuaranies(motel.startingPrice)}` : PRICE_UPDATING_MESSAGE}</p></div>
            </Link>
          ))}
          {featuredMotels.length === 0 && <p className="text-sm text-slate-500">No hay moteles destacados.</p>}
        </div>
      </section>

      <section className="space-y-2 px-4 py-3">
        <QuickLink href="/mapa" title="Ver mapa" subtitle="Explorá moteles cerca tuyo" icon={Map} tone="map" />
        <div className="grid grid-cols-2 gap-2">
          <QuickLink href="#cities" title="Por ciudad" subtitle="Elegí tu zona" icon={MapPin} tone="city" />
          <QuickLink href="/search?promos=1" title="Promos" subtitle="Ofertas activas" icon={Tag} tone="promo" />
        </div>
      </section>

      {cities.length > 0 && <section id="cities" className="px-4 py-2">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">Moteles por ciudad</h2><Link href="/search" className="text-sm font-semibold text-purple-600">Ver todos</Link></div>
        <div className="space-y-2">{cities.map((city) => {
          const isExpanded = expandedCity === city.name;
          const motels = motelsByCity[city.name] || [];
          return <section key={city.name} className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_12px_rgba(42,0,56,0.07)]"><button type="button" onClick={() => void toggleCity(city)} aria-expanded={isExpanded} className="flex w-full items-center gap-3 p-3.5 text-left"><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><MapPin size={18} /></span><span className="flex-1"><span className="block font-semibold text-slate-900">{city.name}</span><span className="mt-0.5 block text-xs text-slate-500">{city.total} {city.total === 1 ? 'motel' : 'moteles'}</span></span><ChevronDown className={`text-purple-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} size={20} /></button>{isExpanded && <div className="border-t border-slate-100 p-3">{loadingCity === city.name ? <div className="flex items-center justify-center gap-2 py-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={17} />Cargando moteles…</div> : motels.length ? <div className="grid gap-3">{motels.map((motel) => <MotelCard key={motel.id} motel={motel} showFavoriteAction={false} />)}</div> : <p className="py-4 text-center text-sm text-slate-500">No hay moteles publicados en esta ciudad.</p>}</div>}</section>;
        })}</div>
      </section>}
    </main>
  );
}
