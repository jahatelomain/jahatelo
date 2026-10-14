'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useHomeFeatured } from '@/components/public/HomeFeaturedProvider';
import { trackAdEvent, type Advertisement } from '@/hooks/useAdvertisements';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bell, ChevronDown, LoaderCircle, Map, MapPin, Search, Tag } from 'lucide-react';
import type { PublicMotelListItem } from '@/lib/domain/motels/publicListItem';
import { formatGuaranies } from '@/lib/formatCurrency';
import { PRICE_UPDATING_MESSAGE } from '@/lib/domain/motels/pricePresentation';
import MotelCard from '@/components/public/MotelCard';
import MotelLogoHeart from '@/components/public/MotelLogoHeart';

type City = { name: string; total: number };

/* ──────────────────────────────────────────────
   QuickLink redesign: mapa full-width + grid 2col
   ────────────────────────────────────────────── */
function QuickLink({ href, title, subtitle, icon: Icon, tone, horizontal }: {
  href: string;
  title: string;
  subtitle: string;
  icon: typeof Map;
  tone: 'map' | 'city' | 'promo';
  horizontal?: boolean;
}) {
  const themes = {
    map: 'from-[#11233f] via-[#165674] to-[#18a0aa]',
    city: 'from-[#35154f] via-[#69218d] to-[#aa36ad]',
    promo: 'from-[#54113d] via-[#a42166] to-[#ee6b78]',
  };

  if (horizontal) {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-2xl border border-[#ECE4F4] bg-white p-4 shadow-[0_4px_12px_rgba(42,0,56,0.06)] transition duration-200 active:scale-[0.98]"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8E2DE2] to-[#6A1FB5] text-white shadow-md">
          <Icon size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-[#2E0338]">{title}</span>
          <span className="mt-0.5 block text-xs text-[#6A5E6E]">{subtitle}</span>
        </span>
        <ArrowRight size={18} className="text-[#8E2DE2] transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl bg-gradient-to-br ${themes[tone]} p-4 text-white shadow-[0_8px_18px_rgba(42,0,56,0.16)] transition duration-200 active:scale-[0.98]`}
    >
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border border-white/15" />
      <div className="absolute -bottom-8 right-7 h-20 w-20 rounded-full bg-white/10 blur-sm" />
      <div className="relative flex flex-col items-start gap-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/18 ring-1 ring-white/25">
          <Icon size={20} />
        </span>
        <span className="min-w-0">
          <span className="block font-bold">{title}</span>
          <span className="mt-0.5 block text-xs text-white/75">{subtitle}</span>
        </span>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────
   SocialLinks inline (matching iOS app style)
   ────────────────────────────────────────────── */
const SOCIAL_LINKS = [
  {
    name: 'instagram',
    url: 'https://www.instagram.com/jahatelopy',
    gradient: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    name: 'tiktok',
    url: 'https://www.tiktok.com/@jahatelo',
    gradient: 'bg-black',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M12.53.02C13.84 0 15.14.01 16.44.04c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.81 1.12-.01 2.24-.64 2.77-1.64.35-.59.5-1.28.5-1.95V.02z" />
      </svg>
    ),
  },
];

/* ──────────────────────────────────────────────
   MobileHome – redesigned to match iOS + boceto
   ────────────────────────────────────────────── */
export default function MobileHome({ featuredMotels, cities }: { featuredMotels: PublicMotelListItem[]; cities: City[] }) {
  const [query, setQuery] = useState('');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [motelsByCity, setMotelsByCity] = useState<Record<string, PublicMotelListItem[]>>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const [cityErrors, setCityErrors] = useState<Record<string, boolean>>({});
  const { slides, ads } = useHomeFeatured();
  const featuredStrip = useRef<HTMLDivElement>(null);
  const viewedAds = useRef(new Set<string>());

  const featuredItems = useMemo(() => {
    if (!slides) return [];
    const motelById = new globalThis.Map(featuredMotels.map((motel) => [motel.id, motel]));
    const adById = new globalThis.Map(ads.map((ad) => [ad.id, ad]));
    const result: Array<{ kind: 'motel'; data: PublicMotelListItem } | { kind: 'ad'; data: Advertisement }> = [];
    slides.forEach((slide) => {
      if (slide.kind === 'ad') {
        const ad = adById.get(slide.id);
        if (ad) result.push({ kind: 'ad', data: ad });
      } else {
        const motel = motelById.get(slide.id);
        if (motel) result.push({ kind: 'motel', data: motel });
      }
    });
    return result;
  }, [slides, featuredMotels, ads]);

  useEffect(() => {
    if (!featuredStrip.current || !slides) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = (entry.target as HTMLElement).dataset.rotatingAd;
        if (!id || viewedAds.current.has(id)) return;
        viewedAds.current.add(id);
        void trackAdEvent({ advertisementId: id, eventType: 'VIEW', source: 'CAROUSEL' });
      });
    }, { threshold: 0.75 });
    featuredStrip.current.querySelectorAll('[data-rotating-ad]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [slides, featuredItems]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    window.location.assign(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  const loadCity = async (city: City) => {
    setLoadingCity(city.name);
    setCityErrors((current) => ({ ...current, [city.name]: false }));
    try {
      const response = await fetch(`/api/mobile/motels?city=${encodeURIComponent(city.name)}&limit=50`);
      if (!response.ok) throw new Error('No se pudieron cargar los moteles');
      const payload = await response.json();
      setMotelsByCity((current) => ({ ...current, [city.name]: payload.data || [] }));
    } catch {
      setCityErrors((current) => ({ ...current, [city.name]: true }));
    } finally {
      setLoadingCity(null);
    }
  };

  const toggleCity = (city: City) => {
    if (expandedCity === city.name) {
      setExpandedCity(null);
      return;
    }
    setExpandedCity(city.name);
    if (!motelsByCity[city.name]) void loadCity(city);
  };

  /* ── Plan glow helper ── */
  const getPlanGlow = (plan?: string | null) => {
    if (!plan) return '';
    const p = plan.toLowerCase();
    if (p.includes('gold')) return 'ring-2 ring-[#F59E0B] shadow-[0_8px_24px_rgba(245,158,11,0.25)]';
    if (p.includes('diamond')) return 'ring-2 ring-[#22D3EE] shadow-[0_8px_24px_rgba(34,211,238,0.25)]';
    return '';
  };

  return (
    <main className="min-h-screen bg-[#F8F5FC] pb-6 md:hidden">
      {/* ═══════ HEADER CURVO ═══════ */}
      <header className="rounded-b-[36px] bg-[#8E2DE2] px-5 pb-7 pt-12 text-white shadow-[0_8px_24px_rgba(142,45,226,0.25)]">
        {/* Top row: Cerca de mí + Notificaciones */}
        <div className="flex items-center justify-between">
          <Link
            href="/nearby"
            className="inline-flex items-center gap-1.5 rounded-[14px] bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#2E0338] shadow-sm transition active:scale-95"
          >
            <MapPin size={16} fill="currentColor" />
            Cerca de mí
          </Link>
          <Link
            href="/notificaciones"
            aria-label="Notificaciones"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2E0338] shadow-sm transition active:scale-95"
          >
            <Bell size={18} />
          </Link>
        </div>

        {/* Greeting */}
        <div className="mt-4">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
            Encontrá el motel ideal para vos
          </h1>
          <p className="mt-1 text-[13px] text-[#D8B4FE]">
            Cientos de opciones para que elijas dónde ir
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={submit}
          className="mt-4 flex items-center gap-2 rounded-[14px] bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(48,22,56,0.08)]"
        >
          <Search className="ml-1 shrink-0 text-[#9CA3AF]" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por motel, ciudad o amenidad"
            className="min-w-0 flex-1 bg-transparent py-0.5 text-sm font-semibold text-[#2E0338] outline-none placeholder:text-[#9CA3AF]"
          />
          <button
            aria-label="Buscar"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8E2DE2] text-white transition active:scale-95"
          >
            <ArrowRight size={15} />
          </button>
        </form>
      </header>

      {/* ═══════ DESTACADOS CAROUSEL ═══════ */}
      <section className="px-0 pb-2 pt-5">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-[22px] font-extrabold tracking-tight text-[#2E0338]">Destacados</h2>
          <Link href="/search?featured=1" className="text-[12px] font-extrabold text-[#8E2DE2]">
            Ver todos
          </Link>
        </div>

        <div
          ref={featuredStrip}
          className="-mx-0 flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Skeleton loading */}
          {!slides && (
            <div className="h-52 w-[75vw] max-w-[292px] shrink-0 animate-pulse rounded-[20px] bg-[#ECE4F4]" aria-label="Cargando destacados" />
          )}

          {featuredItems.map((item, index) =>
            item.kind === 'motel' ? (
              <Link
                key={`motel-${item.data.id}`}
                href={`/motels/${item.data.slug}`}
                className={`relative w-[75vw] max-w-[292px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-white shadow-[0_9px_24px_rgba(44,24,55,0.1)] transition duration-200 active:scale-[0.97] ${getPlanGlow(item.data.plan)}`}
              >
                {/* Image */}
                <div className="relative h-[175px] w-full bg-[#ECE4F4]">
                  {(item.data.featuredPhotoWeb || item.data.thumbnail) && (
                    <Image
                      src={item.data.featuredPhotoWeb || item.data.thumbnail || ''}
                      alt={item.data.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 390px) 75vw, 292px"
                    />
                  )}
                  {/* Logo heart badge */}
                  {item.data.logoUrl && (
                    <MotelLogoHeart
                      src={item.data.logoUrl}
                      alt={item.data.name}
                      className="absolute left-3 top-3 z-10 h-12 w-12"
                    />
                  )}
                  {/* Badge DESTACADO */}
                  <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#FF6B6B] px-3 py-1.5 shadow-sm">
                    <Tag size={12} className="text-white" fill="currentColor" />
                    <span className="text-[11px] font-extrabold tracking-wide text-white">DESTACADO</span>
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  {/* Text over image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="line-clamp-2 text-[18px] font-extrabold leading-snug text-white drop-shadow-md">
                      {item.data.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-white/95">
                      <MapPin size={14} />
                      <span className="truncate">{item.data.city}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={`ad-${item.data.id}-${index}`}
                data-rotating-ad={item.data.id}
                className="relative w-[75vw] max-w-[292px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-white shadow-[0_9px_24px_rgba(44,24,55,0.1)] transition duration-200 active:scale-[0.97]"
              >
                <div className="relative h-[175px] w-full bg-amber-50">
                  <Image
                    src={item.data.imageUrl || '/motel-placeholder.png'}
                    alt={item.data.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 390px) 75vw, 292px"
                  />
                  {/* Badge PUBLICIDAD */}
                  <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#FFA500] px-3 py-1.5 shadow-sm">
                    <span className="text-[11px] font-extrabold tracking-wide text-white">PUBLICIDAD</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="line-clamp-2 text-[18px] font-extrabold leading-snug text-white drop-shadow-md">
                      {item.data.title}
                    </p>
                    {item.data.linkUrl && (
                      <a
                        href={item.data.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void trackAdEvent({ advertisementId: item.data.id, eventType: 'CLICK', source: 'CAROUSEL' })}
                        className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-white/95"
                      >
                        Ver más <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {slides && featuredItems.length === 0 && (
            <p className="px-5 text-sm text-[#6A5E6E]">No hay moteles destacados.</p>
          )}
        </div>
      </section>

      {/* ═══════ CATEGORÍAS ═══════ */}
      <section className="space-y-2.5 px-4 py-3">
        {/* Mapa full-width */}
        <QuickLink
          href="/mapa"
          title="Ver mapa"
          subtitle="Explorá moteles cerca tuyo"
          icon={Map}
          tone="map"
          horizontal
        />
        {/* Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-2.5">
          <QuickLink href="#cities" title="Por ciudad" subtitle="Elegí tu zona" icon={MapPin} tone="city" />
          <QuickLink href="/search?promos=1" title="Promos" subtitle="Ofertas activas" icon={Tag} tone="promo" />
        </div>
      </section>

      {/* ═══════ CIUDADES EXPANDIBLES ═══════ */}
      {cities.length > 0 && (
        <section id="cities" className="px-4 py-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#2E0338]">Explorar por ciudad</h2>
            <Link href="/search" className="text-[12px] font-extrabold text-[#8E2DE2]">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {cities.slice(0, 5).map((city) => {
              const isExpanded = expandedCity === city.name;
              const motels = motelsByCity[city.name] || [];
              return (
                <section
                  key={city.name}
                  className="overflow-hidden rounded-2xl border border-[#ECE4F4] bg-white shadow-[0_4px_12px_rgba(42,0,56,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => void toggleCity(city)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-3 p-3.5 text-left transition active:bg-[#F8F5FC]"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#8E2DE2]">
                      <MapPin size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-[#2E0338]">{city.name}</span>
                      <span className="mt-0.5 block text-xs text-[#6A5E6E]">
                        {city.total} {city.total === 1 ? 'motel' : 'moteles'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`text-[#8E2DE2] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      size={20}
                    />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#ECE4F4] p-3">
                      {loadingCity === city.name ? (
                        <div className="flex items-center justify-center gap-2 py-5 text-sm text-[#6A5E6E]">
                          <LoaderCircle className="animate-spin" size={17} />
                          Cargando moteles…
                        </div>
                      ) : cityErrors[city.name] ? (
                        <div role="alert" className="py-4 text-center text-sm text-[#6A5E6E]">
                          <p>No se pudieron cargar los moteles de esta ciudad.</p>
                          <button
                            type="button"
                            onClick={() => void loadCity(city)}
                            className="mt-2 rounded-lg px-3 py-2 font-bold text-[#8E2DE2]"
                          >
                            Intentar de nuevo
                          </button>
                        </div>
                      ) : motels.length ? (
                        <div className="grid gap-3">
                          {motels.map((motel) => (
                            <MotelCard key={motel.id} motel={motel} showFavoriteAction={false} />
                          ))}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-sm text-[#6A5E6E]">
                          No hay moteles publicados en esta ciudad.
                        </p>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════ REDES SOCIALES ═══════ */}
      <section className="px-4 pb-4 pt-6 text-center">
        <p className="mb-3 text-[14px] font-bold text-[#2E0338]">¡Encontranos!</p>
        <div className="flex items-center justify-center gap-4">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition active:scale-95 ${social.gradient}`}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}