'use client';

import { useState } from 'react';
import ReviewForm from '@/components/public/ReviewForm';
import ReviewsList from '@/components/public/ReviewsList';

export default function ReviewsSection({ motelId }: { motelId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <ReviewForm motelId={motelId} onSubmitted={() => setRefreshKey((prev) => prev + 1)} />
      <ReviewsList key={refreshKey} motelId={motelId} />
    </div>
  );
}
