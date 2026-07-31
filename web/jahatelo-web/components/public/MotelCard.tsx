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
import { formatGuaranies } from '@/lib/formatCurrency';
import type { PublicMotelListItem } from '@/lib/domain/motels/publicListItem';
import { hasMotelPlanGlow, isMotelPlanDisabled, normalizeMotelPlan } from '@/lib/domain/motels/planPresentation';

export interface MotelCardProps {
  motel: (PublicMotelListItem | {
    id: string;
    name: string;
    slug: string;
    city: string;
    address?: string;
    isFeatured: boolean;
    ratingAvg?: number | null;
    ratingCount?: number | null;
    featuredPhoto?: string | null;
    featuredPhotoWeb?: string | null;
    rooms?: Array<{
      price1h?: number | null;
      price1_5h?: number | null;
      price2h?: number | null;
      price3h?: number | null;
      price12h?: number | null;
      price24h?: number | null;
      priceNight?: number | null;
      amenities?: Array<{ amenity: { name: string; icon?: string | null } }>;
    }>;
    plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
  }) & {
    distanceKm?: number;
  };
}

export default function MotelCard({ motel }: MotelCardProps) {
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const isCanonical = 'rating' in motel;
  const realPhotoUrl = isCanonical
    ? motel.thumbnail || motel.featuredPhoto || null
    : motel.featuredPhotoWeb || motel.featuredPhoto || null;
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = imageFailed ? null : realPhotoUrl;
  const isPlaceholder = !photoUrl;

  // Track vista cuando se hace click en la card
  const handleClick = () => {
    trackMotelView(motel.id, 'LIST');
  };

  const legacyPrices = !isCanonical
    ? (motel.rooms ?? [])
      .flatMap((room) => [room.price1h, room.price1_5h, room.price2h, room.price3h, room.price12h, room.price24h, room.priceNight])
      .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
    : [];
  const minPrice = isCanonical
    ? motel.startingPrice
    : legacyPrices.length > 0 ? Math.min(...legacyPrices) : null;

  // Safe rating average
  const safeRating = (isCanonical ? motel.rating.average : motel.ratingAvg) || 0;
  const ratingCount = (isCanonical ? motel.rating.count : motel.ratingCount) || 0;
  const hasReviews = ratingCount > 0;

  // Get first 3 amenities aggregated from rooms
  const topAmenities = isCanonical
    ? motel.amenities.slice(0, 3)
    : Array.from(new Map(
        (motel.rooms ?? []).flatMap((room) => room.amenities ?? []).map(({ amenity }) => [amenity.name, amenity]),
      ).values()).slice(0, 3);
  const normalizedPlan = normalizeMotelPlan(motel.plan);
  const isDisabled = isMotelPlanDisabled(normalizedPlan);
  const isDiamond = hasMotelPlanGlow(normalizedPlan);
  const isGold = normalizedPlan === 'GOLD';
  const locationLabel = [motel.address, motel.city].filter(Boolean).join(', ') || 'Sin ubicación';

  const cardInner = (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[360px] h-full flex flex-col ${!isDisabled ? 'hover:shadow-lg' : ''} transition-shadow group ${isDisabled ? 'opacity-40 cursor-pointer' : 'cursor-pointer'} ${isDiamond ? 'border-transparent' : ''}`}
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
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {(isCanonical ? motel.tienePromo : false) && (
              <div className="bg-purple-100 text-purple-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                PROMO
              </div>
            )}
            {isDiamond && (
              <div className="flex items-center gap-1 bg-cyan-950/80 backdrop-blur-sm border border-cyan-400/60 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                <svg className="w-2.5 h-2.5 fill-cyan-300" viewBox="0 0 24 24"><path d="M12 2L2 9l10 13L22 9z"/></svg>
                DIAMOND
              </div>
            )}
            {isGold && (
              <div className="flex items-center gap-1 bg-yellow-950/80 backdrop-blur-sm border border-yellow-400/60 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <svg className="w-2.5 h-2.5 fill-yellow-300" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                GOLD
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {motel.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {locationLabel}
            {motel.distanceKm !== undefined && (
              <span className="ml-2 inline-flex items-center gap-1 text-purple-600 font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                a {motel.distanceKm.toFixed(1)} km
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
                  ({ratingCount} {ratingCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </>
            ) : null}
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
          <div className="mt-auto pt-4 border-t border-gray-100">
            {minPrice !== null && minPrice > 0 ? (
              <p className="text-xl font-bold text-purple-600">
                <span className="mr-1 text-sm font-medium text-slate-500">Desde</span>
                {formatGuaranies(minPrice)}
              </p>
            ) : <p className="text-lg font-semibold text-slate-500">Consultar</p>}
          </div>
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

  return <Link href={`/motels/${motel.slug}`} onClick={handleClick}>{cardContent}</Link>;
}
