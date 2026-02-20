'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { trackMotelView } from '@/lib/analyticsService';
import FavoriteButtonClient from '@/components/public/FavoriteButtonClient';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';
import { MOTEL_PATTERN_STYLE } from '@/components/public/motelPattern';
import type { CSSProperties } from 'react';

interface MotelCardProps {
  motel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    neighborhood: string;
    description?: string | null;
    isFeatured: boolean;
    ratingAvg: number;
    ratingCount: number;
    featuredPhoto?: string | null;
    featuredPhotoWeb?: string | null;
    photos?: { url: string; kind: string }[];
    rooms?: {
      price1h?: number | null;
      price2h?: number | null;
      price12h?: number | null;
      amenities?: { amenity: { name: string; icon?: string | null } }[];
    }[];
    plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
    distanceKm?: number;
  };
}

export default function MotelCard({ motel }: MotelCardProps) {
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const facadePhoto = motel.photos?.find((p) => p.kind === 'FACADE');
  const firstPhoto = motel.photos?.[0];
  const realPhotoUrl =
    motel.featuredPhotoWeb || motel.featuredPhoto || facadePhoto?.url || firstPhoto?.url || null;
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = imageFailed ? null : realPhotoUrl;
  const isPlaceholder = !photoUrl;

  // Track vista cuando se hace click en la card
  const handleClick = () => {
    trackMotelView(motel.id, 'LIST');
  };

  // Get minimum price from rooms
  const prices = motel.rooms?.flatMap((r) => [r.price1h, r.price2h, r.price12h].filter((p) => p !== null && p !== undefined)) ?? [];
  const minPrice = prices.length > 0 ? Math.min(...(prices as number[])) : null;

  // Safe rating average
  const safeRating = motel.ratingAvg || 0;
  const hasReviews = motel.ratingCount > 0;

  // Get first 3 amenities aggregated from rooms
  const amenityMap = new Map<string, { name: string; icon?: string | null }>();
  for (const room of motel.rooms ?? []) {
    for (const ra of room.amenities ?? []) {
      if (!amenityMap.has(ra.amenity.name)) {
        amenityMap.set(ra.amenity.name, ra.amenity);
      }
    }
  }
  const topAmenities = Array.from(amenityMap.values()).slice(0, 3);
  const isDisabled = motel.plan === 'FREE';
  const isDiamond = motel.plan === 'DIAMOND';

  const cardInner = (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[360px] h-full flex flex-col ${!isDisabled ? 'hover:shadow-lg' : ''} transition-shadow group ${isDisabled ? 'opacity-40 cursor-default' : 'cursor-pointer'} ${isDiamond ? 'border-transparent' : ''}`}
    >
        {/* Image */}
        <div
          className="relative h-40"
          style={isPlaceholder ? MOTEL_PATTERN_STYLE : undefined}
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={motel.name}
              fill
              quality={85}
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isPlaceholder ? 'opacity-60' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-transparent" />
          )}
          <div className="absolute top-3 left-3">
            <FavoriteButtonClient motelId={motel.id} source="LIST" size="small" />
          </div>
          {motel.isFeatured && (
            <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Destacado
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {motel.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {motel.city}, {motel.neighborhood}
            {motel.distanceKm !== undefined && (
              <span className="ml-2 inline-flex items-center gap-1 text-purple-600 font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {motel.distanceKm} km
              </span>
            )}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            {hasReviews ? (
              <>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    {safeRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  ({motel.ratingCount} {motel.ratingCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Sin reseñas aún</span>
            )}
          </div>

          {/* Amenities */}
          {topAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {topAmenities.map((amenity, idx) => {
                const label = amenity.name;
                const IconComponent = amenity.icon ? iconLibrary[amenity.icon] : undefined;
                return (
                  <span
                    key={idx}
                    title={label}
                    aria-label={label}
                    className="inline-flex items-center justify-center text-xs bg-purple-50 text-purple-600 w-8 h-8 rounded-full"
                  >
                    {IconComponent ? <IconComponent size={14} /> : <span className="text-[10px] font-semibold">•</span>}
                  </span>
                );
              })}
            </div>
          )}

          {/* Price */}
          {minPrice !== null && (
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Desde</p>
              <p className="text-xl font-bold text-purple-600">
                ${minPrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
  );

  const diamondFrameStyle: CSSProperties | undefined = isDiamond
    ? {
        backgroundImage:
          'conic-gradient(from 180deg at 50% 50%, rgba(34,211,238,0.9), rgba(186,230,253,0.9), rgba(14,116,144,0.9), rgba(125,211,252,0.9), rgba(34,211,238,0.9)), repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 6px, rgba(255,255,255,0.05) 6px 12px)',
      }
    : undefined;

  const cardContent = isDiamond ? (
    <div
      className="relative p-[2px] rounded-xl shadow-[0_0_18px_rgba(34,211,238,0.45)]"
      style={diamondFrameStyle}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none diamond-orbit">
        <span className="diamond-orbit-dot" />
      </div>
      <div className="absolute -inset-1 rounded-xl pointer-events-none diamond-shimmer" />
      <div className="rounded-[10px] h-full">{cardInner}</div>
      <style jsx>{`
        .diamond-orbit {
          animation: diamond-orbit 4.2s linear infinite;
        }
        .diamond-shimmer {
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.18) 45%,
            rgba(255, 255, 255, 0) 70%
          );
          animation: diamond-shimmer 7s linear infinite;
          mix-blend-mode: screen;
        }
        .diamond-orbit-dot {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 6px rgba(186, 230, 253, 0.7), 0 0 12px rgba(34, 211, 238, 0.45);
        }
        @keyframes diamond-orbit {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes diamond-shimmer {
          0% {
            transform: translateX(-60%) rotate(20deg);
            opacity: 0;
          }
          10% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: translateX(60%) rotate(20deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  ) : (
    cardInner
  );

  return isDisabled ? cardContent : <Link href={`/motels/${motel.slug}`} onClick={handleClick}>{cardContent}</Link>;
}
