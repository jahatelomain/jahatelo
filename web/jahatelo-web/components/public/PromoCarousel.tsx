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

interface PromoCarouselProps {
  promos: Motel[];
}

export default function PromoCarousel({ promos }: PromoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (promos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [promos.length]);

  if (promos.length === 0) return null;

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full mb-8">
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
        {promos.map((motel, index) => {
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

              {/* Badge PROMO */}
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                PROMO
              </div>

              {/* Info del motel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  {motel.name}
                </h3>
                <p className="text-sm md:text-base text-purple-200">
                  Ver promoción especial →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots Navigation */}
      {promos.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-purple-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a promo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
