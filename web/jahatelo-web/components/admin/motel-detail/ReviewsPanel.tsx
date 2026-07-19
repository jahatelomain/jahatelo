import type { MotelReview } from './types';

type Props = {
  ratingAvg: number | null;
  ratingCount: number | null;
  reviews: MotelReview[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (reviewId: string) => void;
};

export default function ReviewsPanel({
  ratingAvg,
  ratingCount,
  reviews,
  loading,
  onRefresh,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Reseñas</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Promedio: {ratingAvg?.toFixed(1) ?? '—'} ⭐ · {ratingCount ?? 0} reseñas
          </p>
        </div>
        <button onClick={onRefresh} className="text-xs text-slate-500 hover:text-purple-600 transition-colors">
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando reseñas...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <span className="text-4xl text-slate-300">⭐</span>
          <p className="mt-3 text-slate-500 font-medium">Sin reseñas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-sm">
                      {'★'.repeat(review.score)}{'☆'.repeat(5 - review.score)}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{review.score}/5</span>
                    {review.isVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Verificada</span>
                    )}
                    {review.isAnonymous && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">Anónima</span>
                    )}
                  </div>
                  {review.comment && <p className="text-sm text-slate-700 mt-1">{review.comment}</p>}
                  <p className="text-xs text-slate-400 mt-2">
                    {review.isAnonymous ? 'Usuario anónimo' : (review.user?.name || review.user?.email || 'Usuario')}
                    {' · '}
                    {new Date(review.createdAt).toLocaleDateString('es-PY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(review.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Eliminar reseña"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
