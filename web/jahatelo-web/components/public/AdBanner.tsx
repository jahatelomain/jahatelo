'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';

export default function AdBanner({ ad, placement }: { ad: Advertisement; placement?: string }) {
  useEffect(() => {
    if (!ad) return;
    trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: placement || 'SECTION_BANNER' });
  }, [ad, placement]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="relative w-full h-40">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </div>
      <div className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
          <p className="text-sm font-semibold text-slate-900">{ad.title}</p>
          <p className="text-xs text-slate-500">{ad.advertiser}</p>
        </div>
        {ad.linkUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: placement || 'SECTION_BANNER' })}
            className="px-3 py-2 text-sm font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
          >
            Ver más
          </a>
        )}
      </div>
    </div>
  );
}
