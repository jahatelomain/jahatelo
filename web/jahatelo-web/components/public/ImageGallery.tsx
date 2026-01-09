'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images }: { images: { url: string; alt?: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const activeImage = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative h-80 bg-slate-100 rounded-2xl overflow-hidden">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || 'Imagen'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          onClick={() => setLightboxOpen(true)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={image.url}
            className={`relative w-20 h-16 rounded-lg overflow-hidden border ${index === activeIndex ? 'border-purple-600' : 'border-transparent'}`}
            onClick={() => setActiveIndex(index)}
          >
            <Image
              src={image.url}
              alt={image.alt || 'Thumb'}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full max-w-4xl h-[80vh]" onClick={(event) => event.stopPropagation()}>
            <Image
              src={activeImage.url}
              alt={activeImage.alt || 'Imagen'}
              fill
              className="object-contain"
            />
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
