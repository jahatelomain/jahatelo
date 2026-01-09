'use client';

import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '@/components/SkeletonLoader';

interface Review {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string;
  user?: { name?: string | null } | null;
}

export default function ReviewsList({ motelId }: { motelId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?motelId=${motelId}`);
      if (!res.ok) throw new Error('Error al cargar reseñas');
      const data = await res.json();
      setReviews(data.reviews || []);
      setSummary({ avg: data.summary?.avg || 0, count: data.summary?.count || 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [motelId]);

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((review) => {
      if (review.score >= 1 && review.score <= 5) counts[review.score - 1] += 1;
    });
    return counts;
  }, [reviews]);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-3xl font-bold text-slate-900">{summary.avg.toFixed(1)}</div>
        <div>
          <div className="text-sm text-slate-500">{summary.count} reseñas</div>
          <div className="flex items-center gap-1 text-yellow-400">
            {'★★★★★'.split('').map((star, idx) => (
              <span key={idx}>{star}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((value, index) => {
          const count = distribution[value - 1];
          const percent = summary.count > 0 ? (count / summary.count) * 100 : 0;
          return (
            <div key={value} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-slate-600">{value}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-slate-500 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500">Todavía no hay reseñas.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-800">
                  {review.user?.name || 'Usuario'}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div className="text-yellow-400">{'★'.repeat(review.score)}{'☆'.repeat(5 - review.score)}</div>
              {review.comment && <p className="text-sm text-slate-600 mt-2">{review.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
