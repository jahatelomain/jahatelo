'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type ReviewFormProps = {
  motelId: string;
  motelSlug?: string;
  onSubmitted?: () => void;
};

export default function ReviewForm({ motelId, motelSlug, onSubmitted }: ReviewFormProps) {
  const toast = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [restrictionMessage, setRestrictionMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setCanReview(false);
      setRestrictionMessage('Debes iniciar sesión para dejar una reseña.');
      return;
    }

    let cancelled = false;
    fetch(`/api/mobile/reviews/can-review?motelId=${motelId}`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        setCanReview(response.ok && data.canReview === true);
        setRestrictionMessage(response.ok ? '' : (data.error || 'No puedes dejar una reseña en este momento.'));
      })
      .catch(() => {
        if (!cancelled) {
          setCanReview(false);
          setRestrictionMessage('No se pudo verificar si puedes dejar una reseña.');
        }
      });

    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, motelId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (score === 0) {
      toast.warning('Selecciona una puntuación');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/mobile/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ motelId, score, comment, isAnonymous }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al enviar reseña');

      toast.success('Reseña enviada');
      setScore(0);
      setComment('');
      setIsAnonymous(false);
      setCanReview(false);
      setRestrictionMessage('Reseña publicada. Podrás dejar otra dentro de 30 días.');
      onSubmitted?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || canReview === null) {
    return <p className="text-sm text-slate-500">Verificando disponibilidad para reseñar...</p>;
  }

  if (!canReview) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p>{restrictionMessage}</p>
        {!isAuthenticated && (
          <Link
            href={`/login?redirect=/motels/${motelSlug || motelId}`}
            className="mt-2 inline-block font-semibold text-purple-600"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Calificación</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              aria-label={`${value} estrella${value === 1 ? '' : 's'}`}
              onClick={() => setScore(value)}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${score >= value ? 'border-yellow-300 bg-yellow-400' : 'border-slate-200 bg-white'}`}
            >
              <span className="text-sm">★</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="text-sm font-medium text-slate-700">Comentario</label>
        <textarea
          id="review-comment"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Comparte tu experiencia"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
        />
        Publicar como usuario anónimo
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:opacity-60"
      >
        {submitting ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  );
}
