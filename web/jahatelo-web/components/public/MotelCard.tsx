'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { trackMotelView } from '@/lib/analyticsService';
import FavoriteButtonClient from '@/components/public/FavoriteButtonClient';

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
    photos?: { url: string; kind: string }[];
    motelAmenities?: { amenity: { name: string; icon?: string | null } }[];
    rooms?: { price1h?: number | null; price2h?: number | null; price12h?: number | null }[];
    plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
  };
}

export default function MotelCard({ motel }: MotelCardProps) {
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const facadePhoto = motel.photos?.find((p) => p.kind === 'FACADE');
  const firstPhoto = motel.photos?.[0];
  const photoUrl = facadePhoto?.url || firstPhoto?.url;

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

  // Get first 3 amenities
  const topAmenities = motel.motelAmenities?.slice(0, 3) ?? [];
  const isDisabled = motel.plan === 'FREE';

  const cardContent = (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[360px] h-full flex flex-col ${!isDisabled ? 'hover:shadow-lg' : ''} transition-shadow group ${isDisabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}`}
    >
        {/* Image */}
        <div className="relative h-40 bg-gray-200">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={motel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
              <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
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
              {topAmenities.map((ma, idx) => {
                const label = ma.amenity.name;
                const IconComponent = ma.amenity.icon ? iconLibrary[ma.amenity.icon] : undefined;
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

  return isDisabled ? cardContent : <Link href={`/motels/${motel.slug}`} onClick={handleClick}>{cardContent}</Link>;
}
