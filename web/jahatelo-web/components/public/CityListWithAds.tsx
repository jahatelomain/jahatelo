'use client';

import Link from 'next/link';
import AdInlineCard from '@/components/public/AdInlineCard';
import { useAdvertisements } from '@/hooks/useAdvertisements';

type CityItem = {
  name: string;
  total: number;
};

export default function CityListWithAds({ cities }: { cities: CityItem[] }) {
  const { ads } = useAdvertisements('LIST_INLINE');
  let adIndex = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cities.map((city, index) => {
        const showAd = (index + 1) % 5 === 0 && ads[adIndex];
        const ad = showAd ? ads[adIndex++] : null;

        return (
          <div key={city.name} className="space-y-6">
            <Link
              href={`/motels?city=${encodeURIComponent(city.name)}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">Ciudad</p>
              <h3 className="text-lg font-semibold text-slate-900">{city.name}</h3>
              <p className="text-sm text-slate-500">
                {city.total} {city.total === 1 ? 'motel' : 'moteles'}
              </p>
            </Link>
            {ad && (
              <div className="md:col-span-2 lg:col-span-3">
                <AdInlineCard ad={ad} placement="LIST_INLINE" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
