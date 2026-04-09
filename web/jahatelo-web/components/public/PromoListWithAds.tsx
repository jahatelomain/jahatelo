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
  const promoImageUrl = promo?.imageUrl || null;
  const [imgError, setImgError] = useState(false);
  const showImage = promoImageUrl && !imgError;

  return (
    <Link
      href={`/motels/${motel.slug}#promos`}
      className="block bg-white/5 border border-purple-800/40 rounded-2xl overflow-hidden hover:border-purple-600/60 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="relative h-48 bg-purple-950/60">
        {showImage ? (
          <Image
            src={promoImageUrl}
            alt={promo?.title || motel.name}
            fill
            quality={85}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-950/80">
            <svg className="w-12 h-12 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0520]/80 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Promo
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-purple-300 transition-colors">
          {promo?.title || 'Promoción especial'}
        </h3>
        <p className="text-sm text-purple-300/70 mb-2">
          {motel.name}
        </p>
        {promo?.description && (
          <p className="text-sm text-purple-200/50 line-clamp-2">{promo.description}</p>
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
