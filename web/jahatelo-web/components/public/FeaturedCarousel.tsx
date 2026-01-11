'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Motel {
  id: string;
  slug: string;
  name: string;
  featuredPhoto?: string | null;
  photos?: Array<{ url: string; kind: string }>;
}

interface FeaturedCarouselProps {
  featuredMotels: Motel[];
}

export default function FeaturedCarousel({ featuredMotels }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredMotels.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMotels.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [featuredMotels.length]);

  if (featuredMotels.length === 0) return null;

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full mb-8">
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
        {featuredMotels.map((motel, index) => {
          const photoUrl =
            motel.featuredPhoto ||
            motel.photos?.[0]?.url ||
            'https://picsum.photos/800/400?random=' + index;

          return (
            <Link
              key={motel.id}
              href={`/motels/${motel.slug}`}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={photoUrl}
                alt={motel.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Badge DESTACADO */}
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                DESTACADO
              </div>

              {/* Info del motel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  {motel.name}
                </h3>
                <p className="text-sm md:text-base text-purple-200">
                  Ver detalles →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots Navigation */}
      {featuredMotels.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {featuredMotels.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-purple-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a destacado ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
