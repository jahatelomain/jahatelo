'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';

export default function AdInlineCard({ ad, placement }: { ad: Advertisement; placement?: string }) {
  useEffect(() => {
    if (!ad) return;
    trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: placement || 'LIST_INLINE' });
  }, [ad, placement]);

  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative w-full sm:w-48 h-28 bg-slate-100 rounded-xl overflow-hidden">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 200px"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
        <h4 className="text-base font-semibold text-slate-900">{ad.title}</h4>
        <p className="text-sm text-slate-500">{ad.advertiser}</p>
        {ad.description && <p className="text-sm text-slate-600 mt-2">{ad.description}</p>}
      </div>
      {ad.linkUrl && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: placement || 'LIST_INLINE' })}
          className="px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
        >
          Visitar
        </a>
      )}
    </div>
  );
}
