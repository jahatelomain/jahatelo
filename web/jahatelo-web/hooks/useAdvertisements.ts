'use client';

import { useCallback, useEffect, useState } from 'react';

export type Advertisement = {
  id: string;
  title: string;
  advertiser: string;
  imageUrl: string;
  largeImageUrl?: string | null;
  description?: string | null;
  linkUrl?: string | null;
  placement: string;
  status: string;
  priority: number;
  viewCount: number;
  clickCount: number;
};

export function useAdvertisements(placement: string) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const e2eMode = process.env.NEXT_PUBLIC_E2E_MODE === '1';

  const fetchAds = useCallback(async () => {
    if (!placement) return;
    if (e2eMode) {
      setAds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/advertisements?placement=${placement}`);
      if (!res.ok) throw new Error('Error al cargar anuncios');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respuesta no JSON desde /api/advertisements');
      }
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [placement]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, loading, refresh: fetchAds };
}

export async function trackAdEvent({
  advertisementId,
  eventType,
  source,
}: {
  advertisementId: string;
  eventType: 'VIEW' | 'CLICK';
  source?: string;
}) {
  if (process.env.NEXT_PUBLIC_E2E_MODE === '1') return;
  try {
    await fetch('/api/advertisements/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advertisementId,
        eventType,
        deviceType: 'WEB',
        source: source || null,
      }),
    });
  } catch (error) {
    console.error('Error tracking ad event:', error);
  }
}
