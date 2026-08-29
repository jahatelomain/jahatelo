'use client';

import { FormEvent, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const REASONS = [
  ['PRICE', 'Precio incorrecto'],
  ['PHOTO', 'Foto incorrecta'],
  ['LOCATION_OR_CONTACT', 'Ubicación o contacto'],
  ['CLOSED', 'Motel cerrado'],
  ['INFORMATION', 'Información incorrecta'],
  ['OTHER', 'Otro'],
] as const;

export default function ReportMotelButton({ motelId, motelName }: { motelId: string; motelName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const close = () => {
    if (!submitting) setOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) {
      setError('Elegí qué información debemos revisar.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/mobile/motel-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motelId, reason, comment: comment.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No pudimos enviar el reporte.');
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(false); setError(''); }}
        aria-label="Reportar información incorrecta"
        title="Reportar información incorrecta"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-purple-600 transition hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 md:h-11 md:w-11"
      >
        <AlertTriangle size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={(event) => event.currentTarget === event.target && close()}>
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="report-title" className="text-2xl font-bold text-slate-950">Reportar información</h2>
                <p className="mt-1 text-sm text-slate-600">{motelName}</p>
              </div>
              <button type="button" onClick={close} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            {sent ? (
              <div className="py-8 text-center" role="status">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
                <h3 className="mt-4 text-xl font-bold text-slate-950">Reporte enviado</h3>
                <p className="mt-2 text-slate-600">Gracias por ayudarnos a mantener la información actualizada.</p>
                <button type="button" onClick={close} className="mt-6 min-h-12 w-full rounded-xl bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-slate-800">¿Qué debemos revisar?</legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    {REASONS.map(([value, label]) => (
                      <label key={value} className={`flex min-h-14 cursor-pointer items-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${reason === value ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 text-slate-700 hover:border-purple-300'}`}>
                        <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="report-comment" className="mb-2 mt-5 block text-sm font-semibold text-slate-800">Contanos qué debemos corregir (opcional)</label>
                <textarea id="report-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={4} placeholder="Agregá cualquier detalle que nos ayude a verificarlo" className="w-full resize-none rounded-xl border border-slate-300 p-3 text-slate-950 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
                {error && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
                <button type="submit" disabled={submitting} className="mt-5 min-h-12 w-full rounded-xl bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{submitting ? 'Enviando…' : 'Enviar reporte'}</button>
                <p className="mt-3 text-center text-xs text-slate-500">No compartiremos tus datos con el motel.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
