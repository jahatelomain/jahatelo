'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAdvertisements, type Advertisement } from '@/hooks/useAdvertisements';
import { planFeaturedSlides, type HomeSlide } from '@/lib/homeRotation';

type HomeFeaturedState = { slides: HomeSlide[] | null; ads: Advertisement[] };
const HomeFeaturedContext = createContext<HomeFeaturedState>({ slides: null, ads: [] });

// One provider wraps desktop and mobile Web layouts: hidden CSS must not consume
// a second turn for the same visit.
export default function HomeFeaturedProvider({ motelIds, children }: { motelIds: string[]; children: React.ReactNode }) {
  const { ads, loading } = useAdvertisements('CAROUSEL');
  const [slides, setSlides] = useState<HomeSlide[] | null>(null);
  const started = useRef(false);
  const mounted = useRef(false);
  const visitId = useRef<string | null>(null);
  const idsKey = motelIds.join('|');
  useEffect(() => {
    mounted.current = true;
    if (loading || started.current) return () => { mounted.current = false; };
    started.current = true;
    const ids = idsKey ? idsKey.split('|') : [];
    if (!ids.length && !ads.length) {
      setSlides([]);
      return;
    }
    visitId.current ||= crypto.randomUUID();
    fetch('/api/home/rotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'FEATURED_HOME', visitId: visitId.current }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Rotation unavailable');
        return res.json();
      })
      .then((data) => {
        if (mounted.current) setSlides(Array.isArray(data.slides) ? data.slides : []);
      })
      .catch((error) => {
        console.warn('Featured carousel rotation unavailable:', error);
        if (mounted.current) setSlides(planFeaturedSlides(ids, ads.map((ad) => ad.id), BigInt(0)));
      });
    return () => { mounted.current = false; };
  }, [loading, idsKey, ads]);
  const value = useMemo(() => ({ slides, ads }), [slides, ads]);
  return <HomeFeaturedContext.Provider value={value}>{children}</HomeFeaturedContext.Provider>;
}

export const useHomeFeatured = () => useContext(HomeFeaturedContext);
