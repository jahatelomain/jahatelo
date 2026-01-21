'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import { useAdvertisements, trackAdEvent } from '@/hooks/useAdvertisements';

const STORAGE_KEY = 'ad_popup_last_seen';

export default function AdPopup() {
  const { ads } = useAdvertisements('POPUP_HOME');
  const [open, setOpen] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const ad = useMemo(() => ads[0], [ads]);
  const imageUrl = ad?.largeImageUrl || '/motel-placeholder.png';

  useEffect(() => {
    if (!ad) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastSeen = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (lastSeen === today) return;
    setOpen(false);
    setImageReady(false);
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (!active) return;
      setImageReady(true);
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, today);
      trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'POPUP_HOME' });
    };
    img.onerror = () => {
      if (!active) return;
      setImageReady(true);
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, today);
      trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'POPUP_HOME' });
    };
    img.src = imageUrl;
    return () => {
      active = false;
    };
  }, [ad, imageUrl]);

  if (!ad || !open || !imageReady) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/80 z-10"
          aria-label="Cerrar anuncio"
        >
          ✕
        </button>
        <div className="relative h-64 bg-slate-100">
          <NextImage
            src={imageUrl}
            alt={ad.title}
            fill
            quality={85}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
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
              onClick={() => trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: 'POPUP_HOME' })}
              className="inline-flex items-center justify-center w-full bg-purple-600 text-white rounded-lg py-2 font-semibold hover:bg-purple-700 transition"
            >
              Visitar sitio
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
