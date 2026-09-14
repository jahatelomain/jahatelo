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
  likes: number;
  likedByCurrentUser?: boolean;
  ownerReply?: string | null;
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
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

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

  const reportReview = async (reviewId: string, reason: 'REVIEW_SPAM' | 'REVIEW_OFFENSIVE') => {
    setSubmittingReport(true);
    try {
      const response = await fetch('/api/mobile/reviews/report', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar la denuncia');
      toast.success(data.alreadyReported ? 'Esta denuncia ya está en revisión' : 'Denuncia recibida');
      setReportingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la denuncia');
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleLike = async (reviewId: string) => {
    setLikingId(reviewId);
    try {
      const response = await fetch(`/api/mobile/reviews/${reviewId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Inicia sesión para indicar que te gusta una reseña');
      setReviews((current) => current.map((review) => review.id === reviewId
        ? { ...review, likes: data.likes, likedByCurrentUser: data.liked }
        : review));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la reseña');
    } finally {
      setLikingId(null);
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
            {review.ownerReply && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Respuesta del motel</p>
                <p className="mt-1 text-sm text-slate-600">{review.ownerReply}</p>
              </div>
            )}
            <button
              type="button"
              disabled={review.isOwn || likingId === review.id}
              onClick={() => toggleLike(review.id)}
              className={`mt-3 text-xs font-semibold disabled:opacity-50 ${review.likedByCurrentUser ? 'text-purple-700' : 'text-slate-500'}`}
            >
              {review.likedByCurrentUser ? '♥' : '♡'} {review.likes || 0}
            </button>
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
            {!review.isOwn && reportingId !== review.id && (
              <button type="button" onClick={() => setReportingId(review.id)} className="mt-3 text-xs font-semibold text-slate-500 hover:text-red-700">
                Denunciar reseña
              </button>
            )}
            {!review.isOwn && reportingId === review.id && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">¿Cuál es el motivo?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={submittingReport} onClick={() => reportReview(review.id, 'REVIEW_SPAM')} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">Spam o engaño</button>
                  <button type="button" disabled={submittingReport} onClick={() => reportReview(review.id, 'REVIEW_OFFENSIVE')} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Contenido inapropiado</button>
                  <button type="button" disabled={submittingReport} onClick={() => setReportingId(null)} className="px-2 py-2 text-xs text-slate-500">Cancelar</button>
                </div>
              </div>
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
