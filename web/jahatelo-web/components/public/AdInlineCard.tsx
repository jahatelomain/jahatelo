'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';

export default function AdInlineCard({ ad, placement }: { ad: Advertisement; placement?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ad) return;
    trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: placement || 'LIST_INLINE' });
  }, [ad, placement]);

  const handleOpen = () => {
    if (!ad) return;
    setOpen(true);
    trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: placement || 'LIST_INLINE' });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-left w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
      >
        <div className="relative h-48 bg-gray-200">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Publicidad
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {ad.title}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{ad.advertiser}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-400">Publicidad</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
              Anuncio
            </span>
          </div>
          {ad.description && <p className="text-sm text-gray-500 mt-3">{ad.description}</p>}
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative h-64 bg-slate-100">
              <Image
                src={ad.largeImageUrl || ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 bg-white/90 text-slate-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white"
                aria-label="Cerrar anuncio"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
                <h3 className="text-lg font-semibold text-slate-900">{ad.title}</h3>
                <p className="text-sm text-slate-500">{ad.advertiser}</p>
              </div>
              {ad.description && <p className="text-sm text-slate-600">{ad.description}</p>}
              {ad.linkUrl && (
                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-purple-600 text-white rounded-lg py-2 font-semibold hover:bg-purple-700 transition"
                >
                  Visitar sitio
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
