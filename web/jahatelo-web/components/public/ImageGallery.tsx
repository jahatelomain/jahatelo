'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images }: { images: { url: string; alt?: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  const safeImages = useMemo(
    () => (images || []).filter((image) => Boolean(image?.url)),
    [images]
  );

  if (safeImages.length === 0) return null;

  const safeIndex = Math.min(activeIndex, safeImages.length - 1);
  const activeImage = safeImages[safeIndex];
  const isActiveBroken = Boolean(brokenUrls[activeImage.url]);

  return (
    <div className="space-y-3">
      <div className="relative h-80 bg-slate-100 rounded-2xl overflow-hidden">
        {isActiveBroken ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
            <span className="text-sm text-purple-600 font-semibold">Imagen no disponible</span>
          </div>
        ) : (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || 'Imagen'}
            fill
            quality={85}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            onClick={() => setLightboxOpen(true)}
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
            onClick={() => setActiveIndex(index)}
          >
            {isBroken ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                Sin imagen
              </div>
            ) : (
              <Image
                src={image.url}
                alt={image.alt || 'Thumb'}
                fill
                quality={85}
                className="object-cover"
                sizes="80px"
                onError={() => setBrokenUrls((prev) => ({ ...prev, [image.url]: true }))}
              />
            )}
          </button>
        );
        })}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full max-w-4xl h-[80vh]" onClick={(event) => event.stopPropagation()}>
            {isActiveBroken ? (
              <div className="w-full h-full flex items-center justify-center bg-black/50">
                <span className="text-white text-sm">Imagen no disponible</span>
              </div>
            ) : (
              <Image
                src={activeImage.url}
                alt={activeImage.alt || 'Imagen'}
                fill
                quality={85}
                className="object-contain"
              />
            )}
            <button
              className="absolute top-4 right-4 bg-white/90 rounded-full w-10 h-10"
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
