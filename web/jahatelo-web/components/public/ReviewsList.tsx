'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '@/components/SkeletonLoader';
import { useToast } from '@/contexts/ToastContext';

interface Review {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string;
  isOwn?: boolean;
  user?: { name?: string | null } | null;
}

const PAGE_SIZE = 20;

export default function ReviewsList({ motelId }: { motelId: string }) {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/mobile/reviews?motelId=${motelId}&limit=${PAGE_SIZE}&offset=0`,
        { credentials: 'include' },
      );
      if (!response.ok) throw new Error('Error al cargar reseñas');
      const data = await response.json();
      setReviews(data.reviews || []);
      setSummary({
        avg: data.summary?.average || 0,
        count: data.summary?.count || data.meta?.total || 0,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  }, [motelId, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/mobile/reviews?motelId=${motelId}&limit=${PAGE_SIZE}&offset=${reviews.length}`,
        { credentials: 'include' },
      );
      if (!response.ok) throw new Error('Error al cargar más reseñas');
      const data = await response.json();
      setReviews((current) => [...current, ...(data.reviews || [])]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar más reseñas');
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm('¿Deseas eliminar tu reseña?')) return;
    setDeletingId(reviewId);
    try {
      const response = await fetch(`/api/mobile/reviews?id=${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar la reseña');
      toast.success('Reseña eliminada');
      await fetchReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la reseña');
    } finally {
      setDeletingId(null);
    }
  };

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
          <div className="flex items-center gap-1 text-yellow-400" aria-label={`${summary.avg.toFixed(1)} de 5 estrellas`}>
            {'★★★★★'.split('').map((star, index) => <span key={index}>{star}</span>)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((value) => {
          const count = distribution[value - 1];
          const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={value} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-slate-600">{value}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-8 text-right text-slate-500">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500">Todavía no hay reseñas.</p>
        ) : reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-800">{review.user?.name || 'Usuario'}</div>
              <div className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('es-PY')}</div>
            </div>
            <div className="text-yellow-400" aria-label={`${review.score} de 5 estrellas`}>
              {'★'.repeat(review.score)}{'☆'.repeat(5 - review.score)}
            </div>
            {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
            {review.isOwn && (
              <button
                type="button"
                disabled={deletingId === review.id}
                onClick={() => deleteReview(review.id)}
                className="mt-3 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                {deletingId === review.id ? 'Eliminando...' : 'Eliminar mi reseña'}
              </button>
            )}
          </div>
        ))}
      </div>

      {reviews.length < summary.count && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={loadMore}
          className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 disabled:opacity-50"
        >
          {loadingMore ? 'Cargando...' : `Cargar más (${summary.count - reviews.length})`}
        </button>
      )}
    </div>
  );
}
