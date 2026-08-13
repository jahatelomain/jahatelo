'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type CropPosition = { x: number; y: number; zoom: number };
export type FeaturedCrop = { web: CropPosition; app: CropPosition };

type Props = {
  file: File | null;
  mode: 'auto' | 'web' | 'app';
  onCancel: () => void;
  onConfirm: (crops: FeaturedCrop) => void;
};

const INITIAL_CROPS: FeaturedCrop = {
  web: { x: 50, y: 50, zoom: 1 },
  app: { x: 50, y: 50, zoom: 1 },
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
  const moveCrop = (variant: 'web' | 'app', horizontal: number, vertical: number) => {
    setCrops((current) => ({
      ...current,
      [variant]: {
        x: Math.max(0, Math.min(100, current[variant].x + horizontal)),
        y: Math.max(0, Math.min(100, current[variant].y + vertical)),
      },
    }));
  };
  const changeZoom = (variant: 'web' | 'app', amount: number) => {
    setCrops((current) => ({
      ...current,
      [variant]: { ...current[variant], zoom: Math.max(1, Math.min(2.5, Number((current[variant].zoom + amount).toFixed(1)))) },
    }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="featured-crop-title">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-2">
          <h3 id="featured-crop-title" className="text-lg font-semibold text-slate-900">Ajustar encuadre de la foto</h3>
          <p className="mt-1 text-sm text-slate-600">Arrastrá la foto dentro del marco, usá las flechas para moverla y − / + para alejar o acercar. Podés dejar un encuadre distinto para Web y App.</p>
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
                  <img src={previewUrl} alt={`Previsualización ${ratioLabel}`} className="h-full w-full object-cover transition-transform" style={{ objectPosition: `${crop.x}% ${crop.y}%`, transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">Arrastrá o usá los controles.</p>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-3 gap-1" aria-label={`Mover foto ${ratioLabel}`}>
                      <span />
                      <MoveButton label="Mover arriba" onClick={() => moveCrop(variant, 0, -10)}>↑</MoveButton>
                      <span />
                      <MoveButton label="Mover a la izquierda" onClick={() => moveCrop(variant, -10, 0)}>←</MoveButton>
                      <MoveButton label="Centrar foto" onClick={() => setCrops((current) => ({ ...current, [variant]: { ...current[variant], x: 50, y: 50 } }))}>⌾</MoveButton>
                      <MoveButton label="Mover a la derecha" onClick={() => moveCrop(variant, 10, 0)}>→</MoveButton>
                      <span />
                      <MoveButton label="Mover abajo" onClick={() => moveCrop(variant, 0, 10)}>↓</MoveButton>
                      <span />
                    </div>
                    <div className="flex flex-col gap-1 border-l border-slate-200 pl-2" aria-label={`Zoom de foto ${ratioLabel}`}>
                      <MoveButton label="Acercar foto" onClick={() => changeZoom(variant, 0.1)}>+</MoveButton>
                      <MoveButton label="Alejar foto" onClick={() => changeZoom(variant, -0.1)}>−</MoveButton>
                    </div>
                  </div>
                </div>
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

function MoveButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">{children}</button>;
}
