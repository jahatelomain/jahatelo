'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';

export type CropPosition = { x: number; y: number };
export type FeaturedCrop = { web: CropPosition; app: CropPosition };

type Props = {
  file: File | null;
  mode: 'auto' | 'web' | 'app';
  onCancel: () => void;
  onConfirm: (crops: FeaturedCrop) => void;
};

const INITIAL_CROPS: FeaturedCrop = {
  web: { x: 50, y: 50 },
  app: { x: 50, y: 50 },
};

export default function FeaturedPhotoCropDialog({ file, mode, onCancel, onConfirm }: Props) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [crops, setCrops] = useState<FeaturedCrop>(INITIAL_CROPS);
  const dragStartRef = useRef<{ variant: 'web' | 'app'; x: number; y: number; crop: CropPosition } | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!file || !previewUrl || typeof document === 'undefined') return null;
  const variants = mode === 'auto' ? (['web', 'app'] as const) : [mode];
  const startDrag = (variant: 'web' | 'app', event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { variant, x: event.clientX, y: event.clientY, crop: crops[variant] };
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(100, drag.crop.x - ((event.clientX - drag.x) / bounds.width) * 100));
    const nextY = Math.max(0, Math.min(100, drag.crop.y - ((event.clientY - drag.y) / bounds.height) * 100));
    setCrops((current) => ({ ...current, [drag.variant]: { x: nextX, y: nextY } }));
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="featured-crop-title">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-2">
          <h3 id="featured-crop-title" className="text-lg font-semibold text-slate-900">Ajustar encuadre de la foto</h3>
          <p className="mt-1 text-sm text-slate-600">Arrastrá directamente la foto para elegir qué parte se verá. Podés dejar un encuadre distinto para Web y App.</p>
        </div>
        <div className={`mt-5 grid gap-5 ${variants.length === 2 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
          {variants.map((variant) => {
            const web = variant === 'web';
            const ratioLabel = web ? 'Web · 16:9' : 'App · 4:5';
            const crop = crops[variant];
            return (
              <section key={variant} className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">{ratioLabel}</h4>
                <div
                  className={`touch-none cursor-grab overflow-hidden rounded-lg bg-slate-100 active:cursor-grabbing ${web ? 'aspect-[16/9]' : 'aspect-[4/5] max-w-[260px]'}`}
                  onPointerDown={(event) => startDrag(variant, event)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  title="Arrastrá la foto para mover el encuadre"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- objeto local antes de subirlo */}
                  <img src={previewUrl} alt={`Previsualización ${ratioLabel}`} className="h-full w-full object-cover" style={{ objectPosition: `${crop.x}% ${crop.y}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Arrastrá la imagen para mover el encuadre.</p>
              </section>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button type="button" onClick={() => onConfirm(crops)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">Usar este encuadre</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
