'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, MonitorSmartphone, RefreshCw, Route, UserCheck, Users, X } from 'lucide-react';

type Visitor = {
  anonymousId: string; firstSeen: string; lastSeen: string; events: number; sessions: number;
  platforms: string[]; lastPath: string | null; user: { id: string; name: string | null; email: string } | null;
};
type Stats = {
  period: { days: number; since: string };
  summary: { totalEvents: number; installations: number; sessions: number; identifiedUsers: number; newInstallations: number; returningInstallations: number; returnRate: number; pagesPerSession: number; bounceRate: number; averageSessionMinutes: number };
  platforms: { platform: string; sessions: number; installations: number }[];
  daily: { day: string; sessions: number; installations: number; events: number }[];
  topPaths: { path: string; views: number }[];
  funnel: { stage: string; installations: number }[];
  visitors: Visitor[];
};
type DetailEvent = { id: string; sessionId: string | null; platform: string; event: string; path: string | null; referrer: string | null; metadata: Record<string, unknown> | null; createdAt: string; user: Visitor['user'] };

const ranges = [{ label: '7 días', value: 7 }, { label: '30 días', value: 30 }, { label: '90 días', value: 90 }];
const platformLabels: Record<string, string> = { web: 'Web', ios: 'iOS', android: 'Android' };
const eventLabels: Record<string, string> = {
  session_start: 'Inició sesión de navegación', page_view: 'Visitó una página', screen_view: 'Abrió una pantalla', motel_view: 'Vio un motel',
  search: 'Realizó una búsqueda', city_view: 'Exploró una ciudad', map_view: 'Abrió el mapa', favorite_add: 'Agregó un favorito',
  favorite_remove: 'Quitó un favorito', phone_click: 'Tocó llamar', whatsapp_click: 'Abrió WhatsApp', map_click: 'Pidió indicaciones',
  website_click: 'Abrió un sitio web', promo_view: 'Vio una promoción', promo_claim: 'Reclamó una promoción', register_start: 'Inició un registro', register_complete: 'Completó un registro',
};
const formatNumber = new Intl.NumberFormat('es-PY');
const formatDate = (value: string) => new Date(value).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });
const shortId = (value: string) => value.slice(0, 8);

export default function VisitorAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'summary' | 'funnel' | 'visitors'>('summary');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<{ anonymousId: string; events: DetailEvent[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/visitors?range=${range}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudieron cargar las estadísticas');
      setStats(payload);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las estadísticas');
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openDetail = async (visitor: Visitor) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await fetch(`/api/admin/analytics/visitors/${encodeURIComponent(visitor.anonymousId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setDetail(payload);
    } catch (reason) {
      setDetailError(reason instanceof Error ? reason.message : 'No se pudo cargar el recorrido');
    } finally { setDetailLoading(false); }
  };

  const filteredVisitors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stats?.visitors ?? [];
    return (stats?.visitors ?? []).filter((visitor) => [visitor.anonymousId, visitor.user?.name, visitor.user?.email, visitor.lastPath, ...visitor.platforms].some((value) => value?.toLowerCase().includes(normalized)));
  }, [query, stats]);

  return <main className="space-y-6 p-4 md:p-8">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-sm font-semibold text-violet-600">Tráfico y recorrido</p><h1 className="text-3xl font-bold text-slate-900">Visitantes</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Medición por instalación anónima. Una persona puede usar varias instalaciones; las cuentas aparecen identificadas solamente cuando inician sesión.</p></div>
      <div className="flex rounded-xl border border-slate-200 bg-white p-1">{ranges.map((item) => <button key={item.value} onClick={() => setRange(item.value)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${range === item.value ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>)}</div>
    </header>

    <nav aria-label="Vistas de visitantes" className="flex gap-1 overflow-x-auto border-b border-slate-200">{[
      ['summary', 'Resumen'], ['funnel', 'Embudo'], ['visitors', 'Visitantes e historial'],
    ].map(([value, label]) => <button key={value} onClick={() => setTab(value as typeof tab)} className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold ${tab === value ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500'}`}>{label}</button>)}</nav>

    {loading ? <LoadingState /> : error ? <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-900">No pudimos cargar Visitantes</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button onClick={fetchStats} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />Reintentar</button></section> : stats ? <>
      {tab === 'summary' && <Summary stats={stats} />}
      {tab === 'funnel' && <Funnel stats={stats} />}
      {tab === 'visitors' && <VisitorsTable visitors={filteredVisitors} query={query} setQuery={setQuery} openDetail={openDetail} detailLoading={detailLoading} />}
    </> : null}
    {detailError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{detailError}</p>}
    {detail && <VisitorDetail detail={detail} close={() => setDetail(null)} />}
  </main>;
}

function Summary({ stats }: { stats: Stats }) {
  const summary = stats.summary;
  const cards = [
    { label: 'Instalaciones activas', value: summary.installations, help: 'Navegadores o instalaciones distintas', Icon: MonitorSmartphone },
    { label: 'Sesiones', value: summary.sessions, help: 'Visitas separadas por 30 min de inactividad', Icon: Activity },
    { label: 'Nuevas', value: summary.newInstallations, help: 'Primera actividad histórica en el período', Icon: Users },
    { label: 'Recurrentes', value: summary.returningInstallations, help: 'Ya existían antes del período', Icon: RefreshCw },
    { label: 'Cuentas identificadas', value: summary.identifiedUsers, help: 'Usuarios que iniciaron sesión', Icon: UserCheck },
  ];
  const max = Math.max(...stats.daily.map((day) => day.sessions), 1);
  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ label, value, help, Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mb-3 h-5 w-5 text-violet-600" /><p className="text-2xl font-bold text-slate-900">{formatNumber.format(value)}</p><p className="text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-400">{help}</p></article>)}</section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SmallMetric label="Tasa de retorno" value={`${summary.returnRate}%`} /><SmallMetric label="Páginas por sesión" value={String(summary.pagesPerSession)} /><SmallMetric label="Rebote aproximado" value={`${summary.bounceRate}%`} /><SmallMetric label="Duración media" value={`${summary.averageSessionMinutes} min`} /></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Sesiones por día</h2><p className="text-xs text-slate-500">Incluye días sin actividad para evitar gráficos engañosos.</p></div></div><div className="flex h-52 items-end gap-1">{stats.daily.map((day) => <div key={day.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="hidden text-[10px] font-semibold text-violet-700 group-hover:block">{day.sessions}</span><div title={`${day.day}: ${day.sessions} sesiones, ${day.installations} instalaciones`} className="w-full rounded-t bg-violet-500 transition hover:bg-violet-700" style={{ height: `${Math.max((day.sessions / max) * 170, day.sessions ? 4 : 1)}px` }} /><span className="hidden text-[9px] text-slate-400 md:block">{stats.daily.length <= 7 || day.day.endsWith('-01') || day === stats.daily.at(-1) ? day.day.slice(5) : ''}</span></div>)}</div></section>
    <section className="grid gap-5 lg:grid-cols-2"><PlatformCards platforms={stats.platforms} /><TopPaths paths={stats.topPaths} /></section>
  </div>;
}

function Funnel({ stats }: { stats: Stats }) {
  const first = stats.funnel[0]?.installations || 1;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-900">Embudo de recorrido</h2><p className="mt-1 text-sm text-slate-500">Cantidad de instalaciones que alcanzaron cada etapa durante el período. No exige que las acciones hayan ocurrido en una única sesión.</p><div className="mt-6 space-y-4">{stats.funnel.map((stage, index) => { const percentage = Math.round((stage.installations / first) * 100); return <article key={stage.stage}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-800">{index + 1}. {stage.stage}</span><span className="text-slate-500">{formatNumber.format(stage.installations)} · {percentage}%</span></div><div className="h-10 overflow-hidden rounded-xl bg-slate-100"><div className="flex h-full min-w-1 items-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 text-xs font-bold text-white transition-all" style={{ width: `${Math.max(percentage, 1)}%` }}>{percentage >= 12 ? `${percentage}%` : ''}</div></div></article>; })}</div></section>;
}

function VisitorsTable({ visitors, query, setQuery, openDetail, detailLoading }: { visitors: Visitor[]; query: string; setQuery: (value: string) => void; openDetail: (visitor: Visitor) => void; detailLoading: boolean }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><label className="relative block"><span className="sr-only">Buscar visitante</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cuenta, identificador, plataforma o última ruta" className="min-h-11 w-full rounded-xl border border-slate-200 px-4 pr-10 text-sm outline-none focus:border-violet-500" />{query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}</label></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Visitante</th><th className="px-3 py-3">Plataforma</th><th className="px-3 py-3">Sesiones</th><th className="px-3 py-3">Eventos</th><th className="px-3 py-3">Última actividad</th><th className="px-5 py-3">Recorrido</th></tr></thead><tbody className="divide-y divide-slate-100">{visitors.map((visitor) => <tr key={visitor.anonymousId}><td className="px-5 py-3"><p className="font-semibold text-slate-900">{visitor.user?.name || visitor.user?.email || `Anónimo ${shortId(visitor.anonymousId)}`}</p><p className="font-mono text-[11px] text-slate-400">{shortId(visitor.anonymousId)}</p></td><td className="px-3 py-3">{visitor.platforms.map((platform) => platformLabels[platform] ?? platform).join(', ')}</td><td className="px-3 py-3">{visitor.sessions}</td><td className="px-3 py-3">{visitor.events}</td><td className="px-3 py-3">{formatDate(visitor.lastSeen)}</td><td className="px-5 py-3"><button disabled={detailLoading} onClick={() => openDetail(visitor)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-50 px-3 font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"><Route className="h-4 w-4" />Ver historial</button></td></tr>)}</tbody></table>{visitors.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No encontramos visitantes con ese criterio.</p>}</div></section>;
}

function VisitorDetail({ detail, close }: { detail: { anonymousId: string; events: DetailEvent[] }; close: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45" role="dialog" aria-modal="true" aria-labelledby="visitor-detail-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white pb-4"><div><p className="text-xs font-semibold uppercase text-violet-600">Recorrido individual</p><h2 id="visitor-detail-title" className="text-xl font-bold text-slate-900">{detail.events.find((event) => event.user)?.user?.name || `Anónimo ${shortId(detail.anonymousId)}`}</h2><p className="mt-1 font-mono text-xs text-slate-400">{detail.anonymousId}</p></div><button onClick={close} aria-label="Cerrar historial" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100"><X className="h-5 w-5" /></button></header><div className="mt-5 space-y-3">{detail.events.map((event) => <article key={event.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{eventLabels[event.event] ?? event.event}</p><p className="mt-1 text-xs text-slate-500">{platformLabels[event.platform] ?? event.platform}{event.path ? ` · ${event.path}` : ''}</p></div><time className="shrink-0 text-xs text-slate-400">{formatDate(event.createdAt)}</time></div>{event.metadata && Object.keys(event.metadata).some((key) => key !== 'environment') && <p className="mt-2 break-words rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-500">{JSON.stringify(Object.fromEntries(Object.entries(event.metadata).filter(([key]) => key !== 'environment')))}</p>}<p className="mt-2 text-[10px] text-slate-400">Sesión: {event.sessionId ? shortId(event.sessionId) : 'evento anterior al seguimiento de sesiones'}</p></article>)}</div></aside></div>;
}

function SmallMetric({ label, value }: { label: string; value: string }) { return <article className="rounded-xl bg-slate-900 p-4 text-white"><p className="text-xl font-bold">{value}</p><p className="text-xs text-slate-300">{label}</p></article>; }
function PlatformCards({ platforms }: { platforms: Stats['platforms'] }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Plataformas</h2><div className="mt-4 space-y-2">{platforms.map((platform) => <div key={platform.platform} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><strong>{platformLabels[platform.platform] ?? platform.platform}</strong><span>{platform.installations} instalaciones · {platform.sessions} sesiones</span></div>)}</div></section>; }
function TopPaths({ paths }: { paths: Stats['topPaths'] }) { const max = paths[0]?.views || 1; return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Páginas y pantallas más vistas</h2><div className="mt-4 space-y-3">{paths.map((path) => <div key={path.path}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate font-mono">{path.path === '/' ? '/inicio' : path.path}</span><strong>{path.views}</strong></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(path.views / max) * 100}%` }} /></div></div>)}</div></section>; }
function LoadingState() { return <div className="space-y-4" aria-label="Cargando estadísticas"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>; }
