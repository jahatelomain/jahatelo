'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';
import { MOTEL_PATTERN_STYLE } from '@/components/public/motelPattern';

export default function ImageGallery({ images }: { images: { url: string; alt?: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  const safeImages = useMemo(
    () => (images || []).filter((image) => Boolean(image?.url)),
    [images]
  );

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext]);

  if (safeImages.length === 0) return null;

  const safeIndex = Math.min(activeIndex, safeImages.length - 1);
  const activeImage = safeImages[safeIndex];
  const isActiveBroken = Boolean(brokenUrls[activeImage.url]);
  const lightboxImage = safeImages[lightboxIndex];
  const isLightboxBroken = Boolean(brokenUrls[lightboxImage?.url]);

  return (
    <div className="space-y-3">
      <div className="relative h-80 bg-slate-100 rounded-2xl overflow-hidden">
        {isActiveBroken ? (
          <div className="w-full h-full" style={MOTEL_PATTERN_STYLE} />
        ) : (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || 'Imagen'}
            fill
            quality={85}
            className="object-cover cursor-zoom-in"
            sizes="(max-width: 768px) 100vw, 800px"
            loading={safeIndex === 0 ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onClick={() => openLightbox(safeIndex)}
            onError={() => setBrokenUrls((prev) => ({ ...prev, [activeImage.url]: true }))}
          />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {safeImages.map((image, index) => {
          const isBroken = Boolean(brokenUrls[image.url]);
          return (
          <button
            key={image.url}
            className={`relative w-20 h-16 rounded-lg overflow-hidden border ${index === safeIndex ? 'border-purple-600' : 'border-transparent'}`}
            onClick={() => { setActiveIndex(index); }}
          >
            {isBroken ? (
              <div
                className="w-full h-full"
                style={{ ...MOTEL_PATTERN_STYLE, backgroundSize: '80px 80px' }}
              />
            ) : (
              <Image
                src={image.url}
                alt={image.alt || 'Thumb'}
                fill
                quality={85}
                className="object-cover"
                sizes="80px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                onError={() => setBrokenUrls((prev) => ({ ...prev, [image.url]: true }))}
              />
            )}
          </button>
        );
        })}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Contenedor principal — detiene propagación */}
          <div
            className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen */}
            {isLightboxBroken ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/60 text-sm">Imagen no disponible</span>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  key={lightboxImage.url}
                  src={lightboxImage.url}
                  alt={lightboxImage.alt || 'Imagen'}
                  fill
                  quality={90}
                  className="object-contain"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  onError={() => setBrokenUrls((prev) => ({ ...prev, [lightboxImage.url]: true }))}
                />
              </div>
            )}

            {/* Botón cerrar */}
            <button
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors"
              onClick={closeLightbox}
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* Prev */}
            {safeImages.length > 1 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
                onClick={lightboxPrev}
                aria-label="Anterior"
              >
                ‹
              </button>
            )}

            {/* Next */}
            {safeImages.length > 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
                onClick={lightboxNext}
                aria-label="Siguiente"
              >
                ›
              </button>
            )}

            {/* Indicador de posición */}
            {safeImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {safeImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
