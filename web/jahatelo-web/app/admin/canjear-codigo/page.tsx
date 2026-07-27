'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

type Result = { valid: boolean; confirmed?: boolean; reason?: string; promoTitle?: string; promoDescription?: string | null };

const reasonText: Record<string, string> = {
  INVALID_CODE: 'El código no existe.', WRONG_PROMO: 'El código no corresponde a esta promoción.',
  ALREADY_USED: 'Este código ya fue canjeado.', PROMO_INACTIVE: 'La promoción no está vigente.',
};

export default function QuickRedeemPage() {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [promoId, setPromoId] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return toast.error('Ingresá los 6 caracteres del código.');
    setLoading(true); setResult(null); setPromoId(null);
    try {
      const lookup = await fetch('/api/admin/promo-codes/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: normalized }) });
      const lookupData = await lookup.json();
      if (!lookup.ok) throw new Error(lookupData.error || 'No se pudo verificar el código');
      const response = await fetch(`/api/admin/promos/${lookupData.promoId}/redeem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: normalized, confirm: false }) });
      const data = await response.json();
      setPromoId(lookupData.promoId); setResult(data);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo verificar el código'); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    if (!promoId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/promos/${promoId}/redeem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim().toUpperCase(), confirm: true }) });
      const data = await response.json();
      if (!data.valid || !data.confirmed) throw new Error(reasonText[data.reason] || 'No se pudo confirmar el canje');
      toast.success('Código canjeado correctamente'); setCode(''); setPromoId(null); setResult(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo confirmar el canje'); }
    finally { setLoading(false); }
  };

  return <div className="mx-auto max-w-xl space-y-6"><div><h1 className="text-2xl font-bold text-slate-900">Canjear código</h1><p className="mt-1 text-sm text-slate-600">Ingresá el código que presenta el cliente y confirmá solo después de validar el beneficio.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><label className="text-sm font-semibold text-slate-700" htmlFor="promo-code">Código de promoción</label><div className="mt-2 flex gap-3"><input id="promo-code" autoFocus maxLength={6} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === 'Enter' && void verify()} placeholder="XXXXXX" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.3em] uppercase focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" /><button onClick={() => void verify()} disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Verificando…' : 'Verificar'}</button></div></section>{result && <section className={`rounded-2xl border p-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><p className="text-lg font-bold text-slate-900">{result.valid ? result.promoTitle : reasonText[result.reason || ''] || 'Código inválido'}</p>{result.valid && <><p className="mt-1 text-sm text-slate-600">{result.promoDescription || 'Código válido para esta promoción.'}</p><p className="mt-4 text-sm font-medium text-green-800">Verificá que el beneficio se aplique antes de confirmar. Esta acción no se puede deshacer.</p><button onClick={() => void confirm()} disabled={loading} className="mt-5 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Confirmar canje</button></>}</section>}</div>;
}
