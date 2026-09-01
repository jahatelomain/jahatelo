'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, FileSearch, MousePointerClick, Search, TrendingUp } from 'lucide-react';

type SearchItem = { query?: string; page?: string; clicks: number; impressions: number; ctr: number; position: number };
type SeoData = {
  configured: boolean;
  siteUrl: string;
  requiredVariables?: string[];
  period?: { days: number; startDate: string; endDate: string };
  summary?: { clicks: number; impressions: number; ctr: number; position: number };
  indexation?: { submitted: number; indexed: number; errors: number; warnings: number };
  queries?: SearchItem[];
  pages?: SearchItem[];
  sitemaps?: Array<{ path: string; lastSubmitted: string | null; pending: boolean; errors: number; warnings: number; submitted: number; indexed: number }>;
};

const number = new Intl.NumberFormat('es-PY');
const decimal = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 1 });

export default function SeoPage() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<SeoData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/seo?days=${days}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo cargar el panel SEO');
        return payload;
      })
      .then((payload) => { if (active) { setData(payload); setError(''); } })
      .catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [days]);

  return (
    <main className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-violet-600">Adquisición orgánica</p><h1 className="text-3xl font-bold text-slate-900">SEO y Search Console</h1><p className="mt-1 text-slate-600">Indexación, rendimiento de búsqueda y estado del sitemap de Jahatelo.</p></div>
        {data?.configured && <select aria-label="Período SEO" value={days} onChange={(event) => setDays(Number(event.target.value))} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value={7}>Últimos 7 días</option><option value={28}>Últimos 28 días</option><option value={90}>Últimos 90 días</option></select>}
      </header>

      {error ? <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-bold">Search Console no respondió</h2><p className="mt-1 text-sm">{error}</p></div></div></section> : !data ? <p className="rounded-2xl bg-white p-6 text-slate-500">Cargando datos SEO…</p> : !data.configured ? <ConfigurationState data={data} /> : <Dashboard data={data} />}
    </main>
  );
}

function ConfigurationState({ data }: { data: SeoData }) {
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" /><div><h2 className="text-xl font-bold text-amber-950">Panel listo para conectar</h2><p className="mt-1 max-w-2xl text-sm text-amber-900">El desarrollo está completo. Para mostrar datos reales, la identidad técnica debe tener acceso de lectura a <strong>{data.siteUrl}</strong> y estas variables deben cargarse como secretos del servidor:</p><ul className="mt-4 space-y-2">{data.requiredVariables?.map((variable) => <li key={variable} className="w-fit rounded-lg bg-white/70 px-3 py-2 font-mono text-xs text-amber-950">{variable}</li>)}</ul><p className="mt-4 text-xs text-amber-800">La clave privada nunca se envía al navegador ni se muestra en este panel.</p></div></div></section>;
}

function Dashboard({ data }: { data: SeoData }) {
  const summary = data.summary!;
  const indexation = data.indexation!;
  const cards = [
    { label: 'Clics', value: number.format(summary.clicks), Icon: MousePointerClick },
    { label: 'Impresiones', value: number.format(summary.impressions), Icon: Search },
    { label: 'CTR promedio', value: `${decimal.format(summary.ctr * 100)}%`, Icon: TrendingUp },
    { label: 'Posición promedio', value: decimal.format(summary.position), Icon: FileSearch },
  ];
  return <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon className="h-5 w-5" /></div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></article>)}</section>
    <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Indexación declarada</h2><p className="mb-5 text-sm text-slate-500">Cobertura informada por los sitemaps.</p><div className="grid grid-cols-2 gap-3"><Metric label="URLs enviadas" value={indexation.submitted} /><Metric label="URLs indexadas" value={indexation.indexed} /><Metric label="Errores" value={indexation.errors} alert={indexation.errors > 0} /><Metric label="Advertencias" value={indexation.warnings} alert={indexation.warnings > 0} /></div></article>
      <DataTable title="Consultas principales" rows={data.queries ?? []} keyName="query" />
    </section>
    <DataTable title="Páginas con mayor visibilidad" rows={data.pages ?? []} keyName="page" />
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Sitemaps</h2><div className="mt-4 space-y-3">{data.sitemaps?.length ? data.sitemaps.map((sitemap) => <article key={sitemap.path} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div className="min-w-0"><a href={sitemap.path} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-sm font-semibold text-violet-700 hover:underline">{sitemap.path}<ExternalLink className="h-3.5 w-3.5 shrink-0" /></a><p className="mt-1 text-xs text-slate-500">Último envío: {sitemap.lastSubmitted ? new Date(sitemap.lastSubmitted).toLocaleString('es-PY') : 'sin fecha'}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-3 py-1">{sitemap.indexed}/{sitemap.submitted} indexadas</span><span className={`rounded-full px-3 py-1 ${sitemap.errors ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{sitemap.errors ? `${sitemap.errors} errores` : 'Sin errores'}</span></div></article>) : <p className="text-sm text-slate-500">No hay sitemaps registrados.</p>}</div></section>
  </>;
}

function Metric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className={`rounded-xl p-3 ${alert ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-800'}`}><p className="text-xl font-bold">{number.format(value)}</p><p className="text-xs">{label}</p></div>;
}

function DataTable({ title, rows, keyName }: { title: string; rows: SearchItem[]; keyName: 'query' | 'page' }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-5"><h2 className="text-lg font-bold text-slate-900">{title}</h2></div>{rows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">No hay datos en este período.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">{keyName === 'query' ? 'Consulta' : 'Página'}</th><th className="px-3 py-3">Clics</th><th className="px-3 py-3">Impresiones</th><th className="px-3 py-3">CTR</th><th className="px-5 py-3">Posición</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row[keyName]}-${index}`}><td className="max-w-md truncate px-5 py-3 font-medium text-slate-800">{row[keyName]}</td><td className="px-3 py-3">{number.format(row.clicks)}</td><td className="px-3 py-3">{number.format(row.impressions)}</td><td className="px-3 py-3">{decimal.format(row.ctr * 100)}%</td><td className="px-5 py-3">{decimal.format(row.position)}</td></tr>)}</tbody></table></div>}</section>;
}
