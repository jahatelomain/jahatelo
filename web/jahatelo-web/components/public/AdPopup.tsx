'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useAdvertisements, trackAdEvent, type Advertisement } from '@/hooks/useAdvertisements';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';

export default function AdPopup() {
  const { ads, loading } = useAdvertisements('POPUP_HOME');
  const [orderedAds, setOrderedAds] = useState<Advertisement[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const started = useRef(false);
  const mounted = useRef(false);
  const viewed = useRef<Set<string>>(new Set());
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    mounted.current = true;
    if (loading || started.current || !ads.length) return () => { mounted.current = false; };
    started.current = true;
    fetch('/api/home/rotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'POPUP_HOME', visitId: crypto.randomUUID() }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Rotation unavailable');
        return res.json();
      })
      .then((data) => {
        if (!mounted.current) return;
        const byId = new Map(ads.map((ad) => [ad.id, ad]));
        const list = (Array.isArray(data.slides) ? data.slides : [])
          .map((slide: { id: string }) => byId.get(slide.id))
          .filter((ad: Advertisement | undefined): ad is Advertisement => Boolean(ad));
        setOrderedAds(list);
      })
      .catch((error) => {
        console.warn('Popup rotation unavailable:', error);
        if (mounted.current) setOrderedAds([...ads].sort((a, b) => a.id.localeCompare(b.id)));
      });
    return () => { mounted.current = false; };
  }, [ads, loading]);

  const ad = orderedAds[index];
  const imageUrl = useMemo(() => ad?.largeImageUrlWeb || ad?.largeImageUrl || ad?.imageUrl || '/motel-placeholder.png', [ad]);
  useEffect(() => {
    if (!orderedAds.length) return;
    let active = true;
    const img = new window.Image();
    img.onload = img.onerror = () => { if (active) setOpen(true); };
    img.src = orderedAds[0].largeImageUrlWeb || orderedAds[0].largeImageUrl || orderedAds[0].imageUrl || '/motel-placeholder.png';
    return () => { active = false; };
  }, [orderedAds]);

  useEffect(() => {
    if (!open || !ad || viewed.current.has(ad.id)) return;
    viewed.current.add(ad.id);
    void trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'POPUP_HOME' });
  }, [ad, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % orderedAds.length);
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + orderedAds.length) % orderedAds.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, orderedAds.length]);

  if (!ad || !open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Publicidad">
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col"
        onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={(event) => {
          if (!touchStart.current || orderedAds.length < 2) return;
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            setIndex((current) => (current + (dx < 0 ? 1 : orderedAds.length - 1)) % orderedAds.length);
          }
          touchStart.current = null;
        }}
      >
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/80 z-10" aria-label="Cerrar anuncio">✕</button>
        <div className="relative h-64 shrink-0 bg-slate-100">
          <NextImage key={ad.id} src={imageUrl} alt={ad.title} fill quality={85} className="object-cover" sizes="(max-width: 768px) 100vw, 560px" loading="eager" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0 overscroll-contain touch-pan-y">
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p><h3 className="text-lg font-semibold text-slate-900">{ad.title}</h3><p className="text-sm text-slate-500">{ad.advertiser}</p></div>
          {ad.description && <p className="text-sm text-slate-600">{ad.description}</p>}
          {ad.linkUrl && <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" onClick={() => void trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: 'POPUP_HOME' })} className="inline-flex items-center justify-center w-full bg-purple-600 text-white rounded-lg py-2 font-semibold hover:bg-purple-700 transition">Visitar sitio</a>}
          {orderedAds.length > 1 && (
            <nav aria-label="Anuncios" className="flex items-center justify-center gap-3 pt-1">
              <button type="button" onClick={() => setIndex((current) => (current - 1 + orderedAds.length) % orderedAds.length)} aria-label="Anuncio anterior" className="px-3 py-1 rounded-lg border border-slate-300 text-slate-900">←</button>
              <span className="text-sm text-slate-600" aria-live="polite">{index + 1} / {orderedAds.length}</span>
              <button type="button" onClick={() => setIndex((current) => (current + 1) % orderedAds.length)} aria-label="Anuncio siguiente" className="px-3 py-1 rounded-lg border border-slate-300 text-slate-900">→</button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
