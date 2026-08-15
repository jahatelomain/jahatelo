'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import AdInlineCard from '@/components/public/AdInlineCard';
import MotelCard, { type MotelCardProps } from '@/components/public/MotelCard';
import { useAdvertisements } from '@/hooks/useAdvertisements';

type CityItem = { name: string; total: number };
type CityMotels = Record<string, MotelCardProps['motel'][]>;

export default function CityListWithAds({ cities }: { cities: CityItem[] }) {
  const { ads, loading: adsLoading } = useAdvertisements('LIST_INLINE');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [motelsByCity, setMotelsByCity] = useState<CityMotels>({});
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const [errorCity, setErrorCity] = useState<string | null>(null);
  const activeAds = adsLoading ? [] : ads;
  let adIndex = 0;

  const toggleCity = async (city: CityItem) => {
    if (expandedCity === city.name) {
      setExpandedCity(null);
      return;
    }

    setExpandedCity(city.name);
    setErrorCity(null);
    if (motelsByCity[city.name]) return;

    setLoadingCity(city.name);
    try {
      const response = await fetch(`/api/mobile/motels?city=${encodeURIComponent(city.name)}&limit=100`);
      if (!response.ok) throw new Error('No se pudieron cargar los moteles de esta ciudad.');
      const payload = await response.json();
      setMotelsByCity((current) => ({ ...current, [city.name]: payload.data || [] }));
    } catch (error) {
      setErrorCity(error instanceof Error ? error.message : 'No se pudieron cargar los moteles de esta ciudad.');
    } finally {
      setLoadingCity(null);
    }
  };

  return (
    <div className="space-y-3">
      {cities.map((city, index) => {
        const showAd = (index + 1) % 5 === 0 && activeAds[adIndex];
        const ad = showAd ? activeAds[adIndex++] : null;
        const isExpanded = expandedCity === city.name;
        const cityMotels = motelsByCity[city.name] || [];

        return (
          <Fragment key={city.name}>
            <section className="overflow-hidden rounded-2xl border border-purple-800/40 bg-white/5 transition-colors">
              <button
                type="button"
                onClick={() => void toggleCity(city)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/10"
              >
                <span className="flex-1"><span className="block text-xs uppercase tracking-wide text-purple-400">Ciudad</span><span className="mt-1 block text-lg font-semibold text-white">{city.name}</span><span className="mt-1 block text-sm text-purple-300/60">{city.total} {city.total === 1 ? 'motel' : 'moteles'}</span></span>
                <ChevronDown className={`shrink-0 text-purple-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={22} />
              </button>
              {isExpanded && <div className="border-t border-purple-800/40 bg-slate-950/20 p-4">
                {loadingCity === city.name ? <div className="flex items-center justify-center gap-2 py-6 text-sm text-purple-200"><LoaderCircle className="animate-spin" size={18} />Cargando moteles…</div> : errorCity ? <p className="py-4 text-sm text-red-300">{errorCity}</p> : cityMotels.length === 0 ? <p className="py-4 text-sm text-purple-200">No hay moteles publicados en esta ciudad.</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{cityMotels.map((motel) => <MotelCard key={motel.id} motel={motel} showFavoriteAction={false} />)}</div>}
              </div>}
            </section>
            {ad && <AdInlineCard key={`${city.name}-ad-${ad.id}`} ad={ad} placement="CITY_LIST" />}
          </Fragment>
        );
      })}
      {cities.length < 5 && activeAds[adIndex] && <AdInlineCard ad={activeAds[adIndex]} placement="CITY_LIST" />}
    </div>
  );
}
