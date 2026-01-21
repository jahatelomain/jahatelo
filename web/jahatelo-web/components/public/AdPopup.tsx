'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAdvertisements, trackAdEvent } from '@/hooks/useAdvertisements';

const STORAGE_KEY = 'ad_popup_last_seen';

export default function AdPopup() {
  const { ads } = useAdvertisements('POPUP_HOME');
  const [open, setOpen] = useState(false);

  const ad = useMemo(() => ads[0], [ads]);

  useEffect(() => {
    if (!ad) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastSeen = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (lastSeen === today) return;
    setOpen(true);
    localStorage.setItem(STORAGE_KEY, today);
    trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'POPUP_HOME' });
  }, [ad]);

  if (!ad || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="relative h-64 bg-slate-100">
          <Image
            src={ad.largeImageUrl || '/motel-placeholder.png'}
            alt={ad.title}
            fill
            quality={85}
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
