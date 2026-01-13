'use client';

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
          <div key={motel.id} className="space-y-6">
            <MotelCard motel={motel} />
            {ad && <AdInlineCard ad={ad} placement="LIST_INLINE" />}
          </div>
        );
      })}
    </div>
  );
}
