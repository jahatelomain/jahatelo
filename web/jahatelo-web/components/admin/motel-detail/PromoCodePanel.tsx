import type { PromoCodeEntry, RedeemResult } from './types';
import AdminImage from './AdminImage';

type Summary = { total: number; pending: number; used: number };
type Props = { promoId: string; input: string; loading: boolean; result: RedeemResult | null; expanded: boolean; codes: PromoCodeEntry[]; summary?: Summary; onInputChange: (value: string) => void; onVerify: () => void; onConfirm: () => void; onToggleHistory: (expanded: boolean) => void };

export default function PromoCodePanel({ input, loading, result, expanded, codes, summary, onInputChange, onVerify, onConfirm, onToggleHistory }: Props) {
  return <section className="mt-4 border-t border-slate-100 pt-4 space-y-3">
    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Validar Código</p>
    <div className="flex gap-2"><input aria-label="Código promocional" type="text" maxLength={6} value={input} onChange={(event) => onInputChange(event.target.value.toUpperCase())} placeholder="XXXXXX" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-purple-600" /><button type="button" onClick={onVerify} disabled={loading || input.length !== 6} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50">{loading ? '...' : 'Verificar'}</button></div>
    <Result result={result} loading={loading} onConfirm={onConfirm} />
    <button type="button" onClick={() => onToggleHistory(!expanded)} className="text-xs text-purple-600 hover:underline">{expanded ? 'Ocultar historial' : 'Ver historial de códigos'}{summary && ` (${summary.total} total)`}</button>
    {expanded && <History codes={codes} summary={summary} />}
  </section>;
}

function Result({ result, loading, onConfirm }: { result: RedeemResult | null; loading: boolean; onConfirm: () => void }) {
  if (!result) return null;
  if (!result.valid) { const messages = { INVALID_CODE: 'Código no encontrado', WRONG_PROMO: 'Este código no corresponde a esta promo', ALREADY_USED: `Ya fue utilizado${result.redeemedAt ? ` el ${new Date(result.redeemedAt).toLocaleDateString('es-PY')}` : ''}`, PROMO_INACTIVE: 'Esta promo no está activa' }; return <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{messages[result.reason]}</div>; }
  if (result.confirmed) return <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium">✓ Código marcado como utilizado</div>;
  return <div className="bg-white border border-green-300 rounded-lg p-3 space-y-2">{result.promoImageUrl && <AdminImage src={result.promoImageUrl} alt={result.promoTitle || 'Promoción'} className="w-full h-24 object-cover rounded" />}<p className="text-sm font-semibold text-slate-900">{result.promoTitle}</p>{result.promoDescription && <p className="text-xs text-slate-600">{result.promoDescription}</p>}<button type="button" onClick={onConfirm} disabled={loading} className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">Confirmar uso (irreversible)</button></div>;
}

function History({ codes, summary }: { codes: PromoCodeEntry[]; summary?: Summary }) {
  if (!codes.length) return <div className="space-y-2">{summary && <SummaryView summary={summary} />}<p className="text-xs text-slate-400 italic">Sin códigos generados aún</p></div>;
  return <div className="space-y-2">{summary && <SummaryView summary={summary} />}<div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-500 border-b"><th>Código</th><th>Estado</th><th>Generado</th><th>Usado el</th></tr></thead><tbody>{codes.map((code) => <tr key={code.id} className="border-b border-slate-50"><td className="py-1 font-mono font-bold">{code.code}</td><td><span className={`px-1.5 py-0.5 rounded font-semibold ${code.status === 'USED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{code.status === 'USED' ? 'Usado' : 'Pendiente'}</span></td><td>{new Date(code.createdAt).toLocaleDateString('es-PY')}</td><td>{code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString('es-PY') : '-'}</td></tr>)}</tbody></table></div></div>;
}
function SummaryView({ summary }: { summary: Summary }) { return <div className="flex gap-3 text-xs text-slate-500"><span>Total: <strong>{summary.total}</strong></span><span>Pendientes: <strong>{summary.pending}</strong></span><span>Usados: <strong>{summary.used}</strong></span></div>; }
