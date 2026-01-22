'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';

export default function AdInlineCard({ ad, placement }: { ad: Advertisement; placement?: string }) {
  const [open, setOpen] = useState(false);
  const adPlaceholder = '/motel-placeholder.png';
  const photoUrl = ad.imageUrl || adPlaceholder;
  const isCityList = placement === 'CITY_LIST';

  useEffect(() => {
    if (!ad) return;
    trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: placement || 'LIST_INLINE' });
  }, [ad, placement]);

  const handleOpen = () => {
    if (!ad) return;
    setOpen(true);
    trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: placement || 'LIST_INLINE' });
  };

  if (isCityList) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className="text-left w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={ad.title}
                fill
                quality={85}
                className="object-cover"
                sizes="44px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7m-2 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                </svg>
              </div>
            )}
            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
              Publicidad
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
            <h3 className="text-base font-semibold text-slate-900 truncate">{ad.title}</h3>
            <p className="text-sm text-slate-500 truncate">{ad.advertiser}</p>
          </div>
        </button>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
              <div className="relative h-64 bg-slate-100">
                <Image
                  src={ad.largeImageUrl || adPlaceholder}
                  alt={ad.title}
                  fill
                  quality={85}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 560px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
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

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-left w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group min-h-[360px] h-full flex flex-col"
      >
        <div className="relative h-40 bg-gray-200">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={ad.title}
              fill
              quality={85}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
              <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7m-2 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
              </svg>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Publicidad
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {ad.title}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{ad.advertiser}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-400">Publicidad</span>
          </div>
          {ad.description && <p className="text-sm text-gray-500">{ad.description}</p>}
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative h-64 bg-slate-100">
              <Image
                src={ad.largeImageUrl || adPlaceholder}
                alt={ad.title}
                fill
                quality={85}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
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
