'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface RoomPhotoGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  roomName: string;
}

export default function RoomPhotoGallery({ images, roomName }: RoomPhotoGalleryProps) {
  const safeImages = useMemo(() => images.filter((image) => Boolean(image.url)), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const previous = useCallback(() => {
    setActiveIndex((index) => (index - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const next = useCallback(() => {
    setActiveIndex((index) => (index + 1) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, next, previous]);

  if (safeImages.length === 0) return null;

  const activeImage = safeImages[Math.min(activeIndex, safeImages.length - 1)];
  const hasMultipleImages = safeImages.length > 1;

  return (
    <>
      <div className="md:w-1/3 bg-gray-100 p-2">
        <div className="relative h-64 md:h-80 overflow-hidden rounded-md bg-gray-200 group">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={`Ampliar foto ${activeIndex + 1} de ${roomName}`}
          />
          <Image
            src={activeImage.url}
            alt={activeImage.alt || `${roomName}, foto ${activeIndex + 1}`}
            fill
            quality={85}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); previous(); }}
                className="absolute z-20 left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); next(); }}
                className="absolute z-20 right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
                aria-label="Foto siguiente"
              >
                <ChevronRight size={22} />
              </button>
              <span className="absolute z-20 right-2 bottom-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                {activeIndex + 1} / {safeImages.length}
              </span>
            </>
          )}
        </div>

        {hasMultipleImages && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {safeImages.map((image, index) => (
              <button
                type="button"
                key={`${image.url}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`relative h-14 w-16 shrink-0 overflow-hidden rounded border-2 ${
                  index === activeIndex ? 'border-purple-600' : 'border-transparent'
                }`}
                aria-label={`Ver foto ${index + 1} de ${roomName}`}
              >
                <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${roomName}`}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative h-[85vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={activeImage.url}
              alt={activeImage.alt || `${roomName}, foto ${activeIndex + 1}`}
              fill
              quality={90}
              className="object-contain"
              sizes="100vw"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-2 top-2 z-10 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              aria-label="Cerrar galería"
            >
              <X size={24} />
            </button>
            {hasMultipleImages && (
              <>
                <button type="button" onClick={previous} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" aria-label="Foto anterior">
                  <ChevronLeft size={28} />
                </button>
                <button type="button" onClick={next} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" aria-label="Foto siguiente">
                  <ChevronRight size={28} />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-sm text-white">
                  {activeIndex + 1} / {safeImages.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
