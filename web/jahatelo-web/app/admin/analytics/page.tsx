'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Eye, Heart, MousePointerClick, RefreshCw, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/admin/SearchableSelect';

type Trend = number | null;
type AnalyticsData = {
  motel: { id: string; name: string } | null;
  isGlobal: boolean;
  analyticsAccess: 'SUMMARY' | 'FULL';
  period: { days: number; startDate: string; endDate: string };
  summary: {
    totalViews: number; totalContacts: number; totalClicksPhone: number; totalClicksWhatsApp: number; totalClicksMap: number; totalClicksWebsite: number;
    totalFavoritesAdded: number; totalFavoritesRemoved: number; netFavorites: number; identifiedViewers: number; uniqueContacts: number; conversionRate: number | null;
  };
  comparison: { views: Trend; contacts: Trend; favorites: Trend; conversion: Trend };
  charts: {
    daily: { date: string; views: number; contacts: number; favorites: number }[];
    bySource: { source: string; count: number }[]; byDevice: { device: string; count: number }[];
    topCities: { city: string; count: number }[];
    topMotels: { motelId: string; motelName: string; views: number; contacts: number; conversionRate: number | null }[];
  };
  recentEvents: { id: string; motelId: string; eventType: string; timestamp: string; source: string | null; userCity: string | null; deviceType: string | null; deviceId: string | null }[];
};
type Motel = { id: string; name: string };
type CurrentUser = { role: 'SUPERADMIN' | 'MOTEL_ADMIN'; motelId?: string | null };

const ranges = [{ label: '7 días', value: '7' }, { label: '30 días', value: '30' }, { label: '90 días', value: '90' }];
const number = new Intl.NumberFormat('es-PY');
const eventLabels: Record<string, string> = { VIEW: 'Vista', CLICK_PHONE: 'Llamada', CLICK_WHATSAPP: 'WhatsApp', CLICK_MAP: 'Mapa', CLICK_WEBSITE: 'Sitio web', FAVORITE_ADD: 'Favorito agregado', FAVORITE_REMOVE: 'Favorito quitado' };
const sourceLabels: Record<string, string> = { HOME: 'Inicio', LIST: 'Listado', SEARCH: 'Búsqueda', DETAIL: 'Detalle', MAP: 'Mapa', MOBILE: 'App móvil' };
const deviceLabels: Record<string, string> = { WEB: 'Web', MOBILE: 'App móvil' };

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [period, setPeriod] = useState('30');
  const [motelId, setMotelId] = useState('');
  const [source, setSource] = useState('');
  const [device, setDevice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.json()).then((payload) => {
      if (!payload.user || !['SUPERADMIN', 'MOTEL_ADMIN'].includes(payload.user.role) || (payload.user.role === 'MOTEL_ADMIN' && !payload.user.motelId)) return router.replace('/admin');
      setUser(payload.user);
      if (payload.user.role === 'MOTEL_ADMIN') setMotelId(payload.user.motelId);
    }).catch(() => router.replace('/admin'));
  }, [router]);

  useEffect(() => {
    if (user?.role !== 'SUPERADMIN') return;
    fetch('/api/admin/motels').then((response) => response.ok ? response.json() : []).then(setMotels).catch(() => setMotels([]));
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (motelId) params.set('motelId', motelId);
      if (source) params.set('source', source);
      if (device) params.set('deviceType', device);
      const response = await fetch(`/api/admin/analytics?${params}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudieron cargar las estadísticas');
      setData(payload); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las estadísticas'); }
    finally { setLoading(false); }
  }, [device, motelId, period, source, user]);

  useEffect(() => { load(); }, [load]);

  return <main className="space-y-6 p-4 md:p-8">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-sm font-semibold text-violet-600">Rendimiento del catálogo</p><h1 className="text-3xl font-bold text-slate-900">{data?.isGlobal === false ? `Analytics · ${data.motel?.name}` : 'Analytics'}</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Vistas e intenciones de contacto de los moteles. Visitantes mide el tráfico general; esta pantalla mide el rendimiento comercial del catálogo.</p></div>
      <div className="flex rounded-xl border border-slate-200 bg-white p-1">{ranges.map((range) => <button key={range.value} onClick={() => setPeriod(range.value)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${period === range.value ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{range.label}</button>)}</div>
    </header>

    <section aria-label="Filtros de Analytics" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
      {user?.role === 'SUPERADMIN' ? <SearchableSelect value={motelId} onChange={setMotelId} placeholder="Todos los moteles" options={[{ value: '', label: 'Todos los moteles' }, ...motels.map((motel) => ({ value: motel.id, label: motel.name }))]} /> : <div className="text-sm font-semibold text-slate-700">{data?.motel?.name}</div>}
      <select aria-label="Filtrar por origen" value={source} onChange={(event) => setSource(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Todos los orígenes</option>{Object.entries(sourceLabels).filter(([value]) => value !== 'MOBILE').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Filtrar por plataforma" value={device} onChange={(event) => setDevice(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Todas las plataformas</option><option value="WEB">Web</option><option value="MOBILE">App móvil</option></select>
    </section>

    {loading ? <Loading /> : error ? <ErrorState message={error} retry={load} /> : data ? <Dashboard data={data} /> : null}
  </main>;
}

function Dashboard({ data }: { data: AnalyticsData }) {
  const cards = [
    { label: 'Vistas de moteles', value: data.summary.totalViews, trend: data.comparison.views, help: 'Aperturas de una ficha', Icon: Eye },
    { label: 'Acciones de contacto', value: data.summary.totalContacts, trend: data.comparison.contacts, help: 'Llamada, WhatsApp, mapa o web', Icon: MousePointerClick },
    { label: 'Visitantes medidos', value: data.summary.identifiedViewers, trend: null, help: 'Navegadores o instalaciones con ID', Icon: Users },
    { label: 'Favoritos agregados', value: data.summary.totalFavoritesAdded, trend: data.comparison.favorites, help: `Balance neto: ${data.summary.netFavorites >= 0 ? '+' : ''}${data.summary.netFavorites}`, Icon: Heart },
    { label: 'Conversión a contacto', value: data.summary.conversionRate === null ? '—' : `${data.summary.conversionRate}%`, trend: data.comparison.conversion, help: 'Personas que vieron y contactaron', Icon: Activity },
  ];
  if (data.analyticsAccess === 'SUMMARY') return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.slice(0, 2).map((card) => <MetricCard key={card.label} {...card} trend={null} />)}</section><p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">El plan BASIC incluye el resumen mensual. Gold y Diamond habilitan tendencias y desgloses.</p></>;
  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <MetricCard key={card.label} {...card} />)}</section>
    {data.summary.identifiedViewers === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Todavía no hay eventos con identidad anónima en este período. Las vistas históricas se conservan, pero la conversión por persona comenzará a calcularse con la nueva medición.</p>}
    <DailyChart rows={data.charts.daily} />
    <section className="grid gap-5 xl:grid-cols-2"><ContactBreakdown data={data} /><Breakdown title="Vistas por plataforma" rows={data.charts.byDevice.map((item) => ({ label: deviceLabels[item.device] || item.device, count: item.count }))} /></section>
    {data.isGlobal && <TopMotels rows={data.charts.topMotels} />}
    <section className="grid gap-5 xl:grid-cols-2"><Breakdown title="Vistas por origen" rows={data.charts.bySource.map((item) => ({ label: sourceLabels[item.source] || item.source, count: item.count }))} /><Breakdown title="Ciudades de las vistas" rows={data.charts.topCities.map((item) => ({ label: item.city, count: item.count }))} empty="Aún no se recibe ciudad suficiente para este desglose." /></section>
    <RecentEvents rows={data.recentEvents} />
  </div>;
}

function MetricCard({ label, value, trend, help, Icon }: { label: string; value: number | string; trend: Trend; help: string; Icon: typeof Eye }) { return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mb-3 h-5 w-5 text-violet-600" /><div className="flex items-end justify-between gap-2"><p className="text-2xl font-bold text-slate-900">{typeof value === 'number' ? number.format(value) : value}</p><Trend value={trend} /></div><p className="text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-400">{help}</p></article>; }
function Trend({ value }: { value: Trend }) { if (value === null) return <span className="text-[10px] text-slate-400">Sin base anterior</span>; const positive = value >= 0; return <span className={`inline-flex items-center text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(value)}%</span>; }

function DailyChart({ rows }: { rows: AnalyticsData['charts']['daily'] }) { const max = Math.max(...rows.map((item) => Math.max(item.views, item.contacts)), 1); return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="font-bold text-slate-900">Actividad por día</h2><p className="text-xs text-slate-500">Violeta: vistas · Verde: acciones de contacto. Se muestran también los días sin actividad.</p></div><div className="flex h-56 items-end gap-1">{rows.map((item) => <div key={item.date} title={`${item.date}: ${item.views} vistas, ${item.contacts} contactos`} className="flex min-w-0 flex-1 items-end justify-center gap-px"><div className="w-1/2 rounded-t bg-violet-500" style={{ height: `${Math.max(item.views / max * 180, item.views ? 3 : 1)}px` }} /><div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${Math.max(item.contacts / max * 180, item.contacts ? 3 : 1)}px` }} /></div>)}</div></section>; }
function ContactBreakdown({ data }: { data: AnalyticsData }) { return <Breakdown title="Acciones de contacto" rows={[{ label: 'WhatsApp', count: data.summary.totalClicksWhatsApp }, { label: 'Llamadas', count: data.summary.totalClicksPhone }, { label: 'Indicaciones', count: data.summary.totalClicksMap }, { label: 'Sitio web', count: data.summary.totalClicksWebsite }]} />; }
function Breakdown({ title, rows, empty = 'No hay datos para este período.' }: { title: string; rows: { label: string; count: number }[]; empty?: string }) { const filtered = rows.filter((row) => row.count > 0); const max = Math.max(...filtered.map((row) => row.count), 1); return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">{title}</h2>{filtered.length ? <div className="mt-4 space-y-3">{filtered.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><strong>{number.format(row.count)}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${row.count / max * 100}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}</section>; }
function TopMotels({ rows }: { rows: AnalyticsData['charts']['topMotels'] }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-5"><h2 className="font-bold text-slate-900">Moteles con más vistas</h2><p className="text-xs text-slate-500">El ranking utiliza solamente aperturas de ficha, no la suma de todos los eventos.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Motel</th><th className="px-3 py-3">Vistas</th><th className="px-3 py-3">Contactos</th><th className="px-5 py-3">Conversión</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={row.motelId}><td className="px-5 py-3 font-semibold">{index + 1}. {row.motelName}</td><td className="px-3 py-3">{row.views}</td><td className="px-3 py-3">{row.contacts}</td><td className="px-5 py-3">{row.conversionRate === null ? '—' : `${row.conversionRate}%`}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-6 text-sm text-slate-500">No hay actividad en este período.</p>}</div></section>; }
function RecentEvents({ rows }: { rows: AnalyticsData['recentEvents'] }) { return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-5"><h2 className="font-bold text-slate-900">Actividad reciente</h2><p className="text-xs text-slate-500">Sirve para verificar qué eventos están llegando y desde dónde.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Evento</th><th className="px-3 py-3">Plataforma</th><th className="px-3 py-3">Origen</th><th className="px-3 py-3">Visitante</th><th className="px-5 py-3">Fecha</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.slice(0, 20).map((row) => <tr key={row.id}><td className="px-5 py-3 font-semibold">{eventLabels[row.eventType] || row.eventType}</td><td className="px-3 py-3">{row.deviceType ? deviceLabels[row.deviceType] || row.deviceType : '—'}</td><td className="px-3 py-3">{row.source ? sourceLabels[row.source] || row.source : '—'}</td><td className="px-3 py-3 font-mono text-xs text-slate-500">{row.deviceId || 'histórico'}</td><td className="px-5 py-3">{new Date(row.timestamp).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-6 text-sm text-slate-500">No hay eventos recientes.</p>}</div></section>; }
function Loading() { return <div className="space-y-4" aria-label="Cargando Analytics"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-900">No pudimos cargar Analytics</h2><p className="mt-1 text-sm text-rose-700">{message}</p><button onClick={retry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />Reintentar</button></section>; }
