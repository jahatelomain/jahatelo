'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

export default function ReviewForm({ motelId, onSubmitted }: { motelId: string; onSubmitted?: () => void }) {
  const toast = useToast();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (score === 0) {
      toast.warning('Selecciona una puntuación');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motelId, score, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar reseña');
      }

      toast.success('Reseña enviada');
      setScore(0);
      setComment('');
      onSubmitted?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Calificación</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              className={`w-9 h-9 rounded-full border ${score >= value ? 'bg-yellow-400 border-yellow-300' : 'bg-white border-slate-200'} flex items-center justify-center`}
            >
              <span className="text-sm">★</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Comentario</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Comparte tu experiencia"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60"
      >
        {submitting ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  );
}
