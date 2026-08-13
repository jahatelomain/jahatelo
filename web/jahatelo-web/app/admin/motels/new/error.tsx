'use client';

import { useEffect } from 'react';

export default function NewMotelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error al abrir alta de motel:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">No se pudo abrir el alta del motel</h1>
        <p className="mt-2 text-sm text-slate-600">No se perdió la información del prospect. Podés reintentar o volver a Prospects.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Reintentar</button>
          <a href="/admin/prospects" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Volver a Prospects</a>
        </div>
      </div>
    </div>
  );
}
