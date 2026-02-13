'use client';

import { Fragment, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdInlineCard from '@/components/public/AdInlineCard';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { BLUR_DATA_URL } from '@/components/imagePlaceholders';

const getActivePromo = (promos: any[] = []) => {
  const now = new Date();
  return promos.find((promo) => {
    if (!promo?.isActive) return false;
    if (promo.validFrom && new Date(promo.validFrom) > now) return false;
    if (promo.validUntil && new Date(promo.validUntil) < now) return false;
    return true;
  });
};

const PromoCard = ({ motel }: { motel: any }) => {
  const promo = getActivePromo(motel.promos || []);
  // Image priority matches app's getMotelImageUrl:
  // promoImageUrl (promo.imageUrl) → featuredPhotoApp → featuredPhotoWeb → featuredPhoto → photos[0]
  const fallbackUrl =
    motel.featuredPhotoApp ||
    motel.featuredPhotoWeb ||
    motel.featuredPhoto ||
    motel.photos?.[0]?.url ||
    '/motel-placeholder.png';
  const primaryUrl = promo?.imageUrl || fallbackUrl;
  const [imgSrc, setImgSrc] = useState(primaryUrl);

  return (
    <Link
      href={`/motels/${motel.slug}#promos`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="relative h-48 bg-gray-200">
        <Image
          src={imgSrc}
          alt={promo?.title || motel.name}
          fill
          quality={85}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          onError={() => { if (imgSrc !== fallbackUrl) setImgSrc(fallbackUrl); }}
        />
        <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Promo
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-1">
          {promo?.title || 'Promoción especial'}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Motel: {motel.name}
        </p>
        {promo?.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{promo.description}</p>
        )}
      </div>
    </Link>
  );
};

export default function PromoListWithAds({ motels }: { motels: any[] }) {
  const { ads, loading } = useAdvertisements('LIST_INLINE');
  const activeAds = loading ? [] : ads;
  let adIndex = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {motels.map((motel, index) => {
        const showAd = (index + 1) % 5 === 0 && activeAds[adIndex];
        const ad = showAd ? activeAds[adIndex++] : null;

        return (
          <Fragment key={motel.id}>
            <PromoCard motel={motel} />
            {ad && <AdInlineCard key={`${motel.id}-ad-${ad.id}`} ad={ad} placement="LIST_INLINE" />}
          </Fragment>
        );
      })}
      {motels.length < 5 && activeAds[adIndex] && (
        <AdInlineCard ad={activeAds[adIndex]} placement="LIST_INLINE" />
      )}
    </div>
  );
}
