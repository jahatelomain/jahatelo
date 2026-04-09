'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import AdInlineCard from '@/components/public/AdInlineCard';
import { useAdvertisements } from '@/hooks/useAdvertisements';

type CityItem = {
  name: string;
  total: number;
};

export default function CityListWithAds({ cities }: { cities: CityItem[] }) {
  const { ads, loading } = useAdvertisements('LIST_INLINE');
  const activeAds = loading ? [] : ads;
  let adIndex = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {cities.map((city, index) => {
        const showAd = (index + 1) % 5 === 0 && activeAds[adIndex];
        const ad = showAd ? activeAds[adIndex++] : null;

        return (
          <Fragment key={city.name}>
            <Link
              href={`/ciudad/${city.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="block bg-white/5 border border-purple-800/40 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-600/60 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <p className="text-xs uppercase tracking-wide text-purple-400 mb-1">Ciudad</p>
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{city.name}</h3>
              <p className="text-sm text-purple-300/60 mt-1">
                {city.total} {city.total === 1 ? 'motel' : 'moteles'}
              </p>
            </Link>
            {ad && <AdInlineCard key={`${city.name}-ad-${ad.id}`} ad={ad} placement="CITY_LIST" />}
          </Fragment>
        );
      })}
      {cities.length < 5 && activeAds[adIndex] && <AdInlineCard ad={activeAds[adIndex]} placement="CITY_LIST" />}
    </div>
  );
}
