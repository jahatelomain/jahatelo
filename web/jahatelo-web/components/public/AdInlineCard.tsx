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
        className="text-left w-full bg-white border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center hover:border-purple-300 hover:bg-purple-50/30 transition"
      >
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
      <span className="px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-200 rounded-lg">
        Ver detalles
      </span>
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
