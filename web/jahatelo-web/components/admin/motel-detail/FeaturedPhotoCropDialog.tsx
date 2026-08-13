'use client';

import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!file || !previewUrl || typeof document === 'undefined') return null;
  const variants = mode === 'auto' ? (['web', 'app'] as const) : [mode];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="featured-crop-title">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-2">
          <h3 id="featured-crop-title" className="text-lg font-semibold text-slate-900">Ajustar encuadre de la foto</h3>
          <p className="mt-1 text-sm text-slate-600">Arrastrá los controles para elegir qué parte de la imagen se verá. Podés dejar un encuadre distinto para Web y App.</p>
        </div>
        <div className={`mt-5 grid gap-5 ${variants.length === 2 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
          {variants.map((variant) => {
            const web = variant === 'web';
            const ratioLabel = web ? 'Web · 16:9' : 'App · 4:5';
            const crop = crops[variant];
            return (
              <section key={variant} className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">{ratioLabel}</h4>
                <div className={`overflow-hidden rounded-lg bg-slate-100 ${web ? 'aspect-[16/9]' : 'aspect-[4/5] max-w-[260px]'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- objeto local antes de subirlo */}
                  <img src={previewUrl} alt={`Previsualización ${ratioLabel}`} className="h-full w-full object-cover" style={{ objectPosition: `${crop.x}% ${crop.y}%` }} />
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-medium text-slate-700">Mover horizontalmente
                    <input className="mt-1.5 w-full accent-violet-600" type="range" min="0" max="100" value={crop.x} onChange={(event) => setCrops((current) => ({ ...current, [variant]: { ...current[variant], x: Number(event.target.value) } }))} />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">Mover verticalmente
                    <input className="mt-1.5 w-full accent-violet-600" type="range" min="0" max="100" value={crop.y} onChange={(event) => setCrops((current) => ({ ...current, [variant]: { ...current[variant], y: Number(event.target.value) } }))} />
                  </label>
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
