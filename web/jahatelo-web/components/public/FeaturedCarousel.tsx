'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdvertisements, trackAdEvent } from '@/hooks/useAdvertisements';
import type { Advertisement } from '@/hooks/useAdvertisements';

interface Motel {
  id: string;
  slug: string;
  name: string;
  featuredPhoto?: string | null;
  photos?: Array<{ url: string; kind: string }>;
  plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
}

interface FeaturedCarouselProps {
  featuredMotels: Motel[];
}

export default function FeaturedCarousel({ featuredMotels }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const { ads } = useAdvertisements('CAROUSEL');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const trackedAdViews = useRef<Set<string>>(new Set());
  const adPlaceholder = '/motel-placeholder.png';

  const mixedItems = useMemo(() => {
    if (!ads.length) {
      return featuredMotels.map((motel) => ({ type: 'motel' as const, data: motel }));
    }

    const result: Array<{ type: 'motel' | 'ad'; data: Motel | Advertisement }> = [];
    const itemsPerAd = 5;

    featuredMotels.forEach((motel, index) => {
      result.push({ type: 'motel', data: motel });
      if ((index + 1) % itemsPerAd === 0) {
        const adIndex = Math.floor(index / itemsPerAd) % ads.length;
        result.push({ type: 'ad', data: ads[adIndex] });
      }
    });

    if (featuredMotels.length < itemsPerAd && ads.length > 0) {
      result.push({ type: 'ad', data: ads[0] });
    }

    return result;
  }, [featuredMotels, ads]);

  useEffect(() => {
    if (mixedItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mixedItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [mixedItems.length]);

  useEffect(() => {
    const currentItem = mixedItems[currentIndex];
    if (currentItem?.type === 'ad') {
      const ad = currentItem.data as Advertisement;
      if (!trackedAdViews.current.has(ad.id)) {
        trackedAdViews.current.add(ad.id);
        trackAdEvent({ advertisementId: ad.id, eventType: 'VIEW', source: 'CAROUSEL' });
      }
    }
  }, [currentIndex, mixedItems]);

  if (mixedItems.length === 0) return null;

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleAdClick = (ad: Advertisement) => {
    setSelectedAd(ad);
    setShowAdModal(true);
    trackAdEvent({ advertisementId: ad.id, eventType: 'CLICK', source: 'CAROUSEL' });
  };

  return (
    <div className="w-full mb-8">
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
        {mixedItems.map((item, index) => {
          const isActive = index === currentIndex;

          if (item.type === 'ad') {
            const ad = item.data as Advertisement;
            const photoUrl = ad.imageUrl || adPlaceholder;

            return (
              <div
                key={`ad-${ad.id}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleAdClick(ad)}
                  className="absolute inset-0"
                >
                  <Image
                    src={photoUrl}
                    alt={ad.title}
                    fill
                    quality={85}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={index === 0}
                  />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-4.472 10.03l-.788 4.734a.75.75 0 001.095.79L10 15.65l4.165 1.904a.75.75 0 001.095-.79l-.788-4.734A6 6 0 0010 2z" />
                  </svg>
                  PUBLICIDAD
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    {ad.title}
                  </h3>
                  <p className="text-sm md:text-base text-amber-200">
                    Ver más →
                  </p>
                </div>
              </div>
            );
          }

          const motel = item.data as Motel;
          const fallbackPhoto = '/motel-placeholder.png';
          const photoUrl =
            failedImages[motel.id]
              ? fallbackPhoto
              : motel.featuredPhoto ||
                motel.photos?.[0]?.url ||
                fallbackPhoto;
          const isPlaceholder = photoUrl === fallbackPhoto;
          const isDisabled = motel.plan === 'FREE';

          return (
            <div
              key={motel.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isDisabled ? (
                <div className="absolute inset-0 cursor-default">
                  <Image
                    src={photoUrl}
                    alt={motel.name}
                    fill
                    quality={85}
                    className={`object-cover ${isPlaceholder ? 'opacity-60' : ''}`}
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={index === 0}
                    onError={() => setFailedImages((prev) => ({ ...prev, [motel.id]: true }))}
                  />
                </div>
              ) : (
                <Link
                  href={`/motels/${motel.slug}`}
                  className="absolute inset-0"
                >
                  <Image
                    src={photoUrl}
                    alt={motel.name}
                    fill
                    quality={85}
                    className={`object-cover ${isPlaceholder ? 'opacity-60' : ''}`}
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={index === 0}
                    onError={() => setFailedImages((prev) => ({ ...prev, [motel.id]: true }))}
                  />
                </Link>
              )}
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
                  {isDisabled ? 'No disponible' : 'Ver detalles →'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots Navigation */}
      {mixedItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {mixedItems.map((_, index) => (
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

      {showAdModal && selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="relative h-64 bg-slate-100">
              <Image
                src={selectedAd.largeImageUrl || adPlaceholder}
                alt={selectedAd.title}
                fill
                quality={85}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <button
                onClick={() => setShowAdModal(false)}
                className="absolute top-3 right-3 bg-white/90 text-slate-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white"
                aria-label="Cerrar anuncio"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Publicidad</p>
                <h3 className="text-lg font-semibold text-slate-900">{selectedAd.title}</h3>
                <p className="text-sm text-slate-500">{selectedAd.advertiser}</p>
              </div>
              {selectedAd.description && (
                <p className="text-sm text-slate-600">{selectedAd.description}</p>
              )}
              {selectedAd.linkUrl && (
                <a
                  href={selectedAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-purple-600 text-white rounded-lg py-2 font-semibold hover:bg-purple-700 transition"
                >
                  Visitar sitio
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
