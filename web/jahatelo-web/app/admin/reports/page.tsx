'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReportMetricsPanel } from '@/components/admin/ReportMetricsPanel';

type Person = { id: string; name: string | null; email: string };
type Note = { id: string; body: string; createdAt: string; author: Person };
type Report = {
  id: string; reason: string; comment: string | null; status: string; createdAt: string;
  assignedToId: string | null; resolutionSummary: string | null;
  motel: { id: string; name: string; city: string }; assignedTo: Person | null; user: Person | null; notes: Note[];
};

const labels: Record<string, string> = {
  PENDING: 'Pendiente', IN_REVIEW: 'En revisión', RESOLVED: 'Resuelto', DISMISSED: 'Descartado',
  PRICE: 'Precio', PHOTO: 'Foto', LOCATION_OR_CONTACT: 'Ubicación o contacto', CLOSED: 'Cerrado', INFORMATION: 'Información', OTHER: 'Otro',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [assignees, setAssignees] = useState<Person[]>([]);
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [note, setNote] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status });
    if (query.trim()) params.set('query', query.trim());
    const response = await fetch(`/api/admin/motel-reports?${params}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      setReports(data.reports || []);
      setAssignees(data.assignees || []);
      setSelected((current) => current ? (data.reports || []).find((item: Report) => item.id === current.id) || null : null);
    }
    setLoading(false);
  }, [query, status]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  const update = async (changes: Record<string, unknown>) => {
    if (!selected) return;
    setSaving(true);
    const response = await fetch(`/api/admin/motel-reports/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
    if (response.ok) { setNote(''); await load(); }
    setSaving(false);
  };

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div><p className="text-sm font-semibold text-violet-600">Catálogo</p><h1 className="text-3xl font-bold text-slate-900">Reportes de usuarios</h1><p className="mt-1 text-slate-600">Bandeja interna exclusiva para superadministradores.</p></div>
      <ReportMetricsPanel />
      <section className="grid gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <input aria-label="Buscar motel" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por motel" className="min-h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-500" />
        <select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-3"><option value="ALL">Todos los estados</option>{['PENDING','IN_REVIEW','RESOLVED','DISMISSED'].map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3" aria-busy={loading}>{loading ? <p className="rounded-2xl bg-white p-6 text-slate-500">Cargando reportes…</p> : reports.length === 0 ? <p className="rounded-2xl bg-white p-6 text-slate-500">No hay reportes con estos filtros.</p> : reports.map((report) => <button key={report.id} onClick={() => { setSelected(report); setResolutionSummary(report.resolutionSummary || ''); }} className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-violet-300 ${selected?.id === report.id ? 'border-violet-500 ring-2 ring-violet-100' : 'border-slate-200'}`}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-900">{report.motel.name}</h2><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{labels[report.status]}</span></div><p className="mt-2 text-sm font-medium text-slate-700">{labels[report.reason]} · {report.motel.city}</p><p className="mt-2 line-clamp-2 text-sm text-slate-500">{report.comment || 'Sin comentario del usuario.'}</p><p className="mt-3 text-xs text-slate-400">Responsable: {report.assignedTo?.name || report.assignedTo?.email || 'Sin asignar'}</p></button>)}</section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">{!selected ? <p className="text-slate-500">Seleccioná un reporte para gestionarlo.</p> : <div className="space-y-5"><div><h2 className="text-xl font-bold">{selected.motel.name}</h2><Link href={`/admin/motels/${selected.motel.id}?reportId=${selected.id}`} className="text-sm font-semibold text-violet-600 hover:underline">Corregir ficha del motel</Link></div><label className="block text-sm font-semibold">Estado<select value={selected.status} onChange={(e) => update({ status: e.target.value })} disabled={saving} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3">{['PENDING','IN_REVIEW','RESOLVED','DISMISSED'].map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label><label className="block text-sm font-semibold">Responsable<select value={selected.assignedToId || ''} onChange={(e) => update({ assignedToId: e.target.value || null })} disabled={saving} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">Sin asignar</option>{assignees.map((person) => <option key={person.id} value={person.id}>{person.name || person.email}</option>)}</select></label><label className="block text-sm font-semibold">Corrección realizada<textarea value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /><button onClick={() => update({ resolutionSummary: resolutionSummary || null })} disabled={saving} className="mt-2 min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Guardar corrección</button></label><label className="block text-sm font-semibold">Nota interna<textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /><button onClick={() => update({ note })} disabled={saving || note.trim().length < 2} className="mt-2 min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Agregar nota</button></label><div><h3 className="font-semibold">Historial interno</h3><div className="mt-2 space-y-2">{selected.notes.length === 0 ? <p className="text-sm text-slate-500">Sin notas.</p> : selected.notes.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm text-slate-700">{item.body}</p><p className="mt-1 text-xs text-slate-400">{item.author.name || item.author.email} · {new Date(item.createdAt).toLocaleString('es-PY')}</p></article>)}</div></div></div>}</aside>
      </div>
    </main>
  );
}
