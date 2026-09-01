'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileWarning } from 'lucide-react';

type Metrics = {
  days: number;
  total: number;
  open: number;
  closed: number;
  averageResolutionHours: number | null;
  recurrentMotels: Array<{ motelId: string; motelName: string; reports: number; open: number }>;
  byReason: Array<{ reason: string; count: number }>;
};

const reasonLabels: Record<string, string> = {
  PRICE: 'Precio', PHOTO: 'Foto', LOCATION_OR_CONTACT: 'Ubicación o contacto',
  CLOSED: 'Cerrado', INFORMATION: 'Información', OTHER: 'Otro',
};

function formatDuration(hours: number | null) {
  if (hours === null) return 'Sin datos';
  if (hours < 24) return `${hours.toLocaleString('es-PY', { maximumFractionDigits: 1 })} h`;
  return `${(hours / 24).toLocaleString('es-PY', { maximumFractionDigits: 1 })} días`;
}

export function ReportMetricsPanel() {
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/motel-reports/metrics?days=${days}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar las métricas');
        return response.json();
      })
      .then((data) => { if (active) { setMetrics(data); setError(false); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [days]);

  return (
    <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm" aria-labelledby="report-metrics-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-metrics-title" className="text-xl font-bold text-slate-900">Métricas operativas</h2>
          <p className="text-sm text-slate-500">Rendimiento de la gestión y moteles con información recurrentemente reportada.</p>
        </div>
        <select aria-label="Período de métricas" value={days} onChange={(event) => setDays(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      {error ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">No se pudieron cargar las métricas.</p> : !metrics ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Calculando métricas…</p> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Reportes recibidos', value: metrics.total, Icon: FileWarning, tone: 'text-violet-700 bg-violet-50' },
            { label: 'Aún abiertos', value: metrics.open, Icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50' },
            { label: 'Cerrados', value: metrics.closed, Icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
            { label: 'Tiempo medio', value: formatDuration(metrics.averageResolutionHours), Icon: Clock3, tone: 'text-sky-700 bg-sky-50' },
          ].map(({ label, value, Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-100 p-4"><div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></article>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-bold text-slate-900">Moteles recurrentes</h3>
            <p className="mb-3 text-xs text-slate-500">Dos o más reportes en el período.</p>
            {metrics.recurrentMotels.length === 0 ? <p className="text-sm text-slate-500">No hay recurrencias.</p> : <div className="space-y-2">{metrics.recurrentMotels.map((motel) => <div key={motel.motelId} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"><span className="truncate text-sm font-semibold text-slate-800">{motel.motelName}</span><span className="shrink-0 text-xs text-slate-500">{motel.reports} reportes · {motel.open} abiertos</span></div>)}</div>}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-bold text-slate-900">Motivos frecuentes</h3>
            <p className="mb-3 text-xs text-slate-500">Distribución de reportes recibidos.</p>
            {metrics.byReason.length === 0 ? <p className="text-sm text-slate-500">Todavía no hay datos.</p> : <div className="space-y-2">{metrics.byReason.map((item) => <div key={item.reason} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"><span>{reasonLabels[item.reason] ?? item.reason}</span><strong>{item.count}</strong></div>)}</div>}
          </div>
        </div>
      </>}
    </section>
  );
}
