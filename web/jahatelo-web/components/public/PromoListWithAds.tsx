'use client';

import { Fragment } from 'react';
import MotelCard from '@/components/public/MotelCard';
import AdInlineCard from '@/components/public/AdInlineCard';
import { useAdvertisements } from '@/hooks/useAdvertisements';

export default function PromoListWithAds({ motels }: { motels: any[] }) {
  const { ads } = useAdvertisements('LIST_INLINE');
  let adIndex = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {motels.map((motel, index) => {
        const showAd = (index + 1) % 5 === 0 && ads[adIndex];
        const ad = showAd ? ads[adIndex++] : null;

        return (
          <Fragment key={motel.id}>
            <MotelCard motel={motel} />
            {ad && <AdInlineCard key={`${motel.id}-ad-${ad.id}`} ad={ad} placement="LIST_INLINE" />}
          </Fragment>
        );
      })}
      {motels.length < 5 && ads[adIndex] && (
        <AdInlineCard ad={ads[adIndex]} placement="LIST_INLINE" />
      )}
    </div>
  );
}
