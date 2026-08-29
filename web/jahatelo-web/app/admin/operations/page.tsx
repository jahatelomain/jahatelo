import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function qualityOf(motel: {
  latitude: number | null; longitude: number | null; phone: string | null; whatsapp: string | null;
  featuredPhotoWeb: string | null; featuredPhotoApp: string | null; featuredPhoto: string | null;
  updatedAt: Date; rooms: Array<{ id: string; roomPhotos: Array<{ id: string }>; dayRates: Array<{ id: string }>; amenities: Array<{ id: string }> }>;
  schedules: Array<{ id: string }>;
}) {
  const checks = [
    motel.latitude !== null && motel.longitude !== null,
    Boolean(motel.phone || motel.whatsapp),
    Boolean(motel.featuredPhotoWeb || motel.featuredPhoto),
    Boolean(motel.featuredPhotoApp || motel.featuredPhoto),
    motel.rooms.length > 0,
    motel.rooms.some((room) => room.roomPhotos.length > 0),
    motel.rooms.some((room) => room.dayRates.length > 0),
    motel.schedules.length > 0,
    motel.rooms.some((room) => room.amenities.length > 0),
  ];
  return { score: Math.round((checks.filter(Boolean).length / checks.length) * 100), missing: ['ubicación', 'contacto', 'portada web', 'portada app', 'habitaciones', 'fotos', 'precios', 'horarios', 'amenities'].filter((_, index) => !checks[index]) };
}

export default async function OperationsPage() {
  const [pendingMotels, reports, prospects, motels] = await Promise.all([
    prisma.motel.findMany({ where: { status: 'PENDING' }, take: 10, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, city: true, createdAt: true } }),
    prisma.motelReport.findMany({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } }, take: 10, orderBy: { createdAt: 'asc' }, include: { motel: { select: { name: true } }, assignedTo: { select: { name: true, email: true } } } }),
    prisma.motelProspect.findMany({ where: { status: 'NEW' }, take: 10, orderBy: { createdAt: 'asc' }, select: { id: true, motelName: true, contactName: true, createdAt: true } }),
    prisma.motel.findMany({ where: { status: 'APPROVED' }, orderBy: { updatedAt: 'asc' }, select: { id: true, name: true, city: true, latitude: true, longitude: true, phone: true, whatsapp: true, featuredPhoto: true, featuredPhotoWeb: true, featuredPhotoApp: true, updatedAt: true, rooms: { select: { id: true, roomPhotos: { select: { id: true }, take: 1 }, dayRates: { select: { id: true }, take: 1 }, amenities: { select: { id: true }, take: 1 } } }, schedules: { select: { id: true }, take: 1 } } }),
  ]);
  const quality = motels.map((motel) => ({ ...motel, ...qualityOf(motel) })).sort((a, b) => a.score - b.score);
  const incomplete = quality.filter((item) => item.score < 100).slice(0, 15);
  const mediaIssues = quality.filter((item) => !item.featuredPhotoWeb || !item.featuredPhotoApp || !item.rooms.some((room) => room.roomPhotos.length));

  const cards = [
    { label: 'Aprobaciones', value: pendingMotels.length, href: '/admin/motels?status=PENDING', tone: 'amber' },
    { label: 'Reportes abiertos', value: reports.length, href: '/admin/reports', tone: 'violet' },
    { label: 'Prospects sin atender', value: prospects.length, href: '/admin/prospects?status=NEW', tone: 'blue' },
    { label: 'Fichas incompletas', value: incomplete.length, href: '#calidad', tone: 'rose' },
    { label: 'Problemas de media', value: mediaIssues.length, href: '#calidad', tone: 'slate' },
  ];
  return <main className="space-y-7 p-4 md:p-8"><div><p className="text-sm font-semibold text-violet-600">SUPERADMIN</p><h1 className="text-3xl font-bold">Bandeja operativa</h1><p className="mt-1 text-slate-600">Prioridades de publicación, soporte comercial y calidad del catálogo.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <Link key={card.label} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-violet-300"><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p></Link>)}</section><section className="grid gap-5 xl:grid-cols-3"><Queue title="Aprobaciones" empty="No hay moteles pendientes." items={pendingMotels.map((item) => ({ id: item.id, title: item.name, detail: `${item.city} · ${item.createdAt.toLocaleDateString('es-PY')}`, href: `/admin/motels/${item.id}` }))} /><Queue title="Reportes" empty="No hay reportes abiertos." items={reports.map((item) => ({ id: item.id, title: item.motel.name, detail: `${item.status === 'PENDING' ? 'Pendiente' : 'En revisión'} · ${item.assignedTo?.name || item.assignedTo?.email || 'Sin asignar'}`, href: '/admin/reports' }))} /><Queue title="Prospects" empty="No hay prospects nuevos." items={prospects.map((item) => ({ id: item.id, title: item.motelName, detail: `${item.contactName} · ${item.createdAt.toLocaleDateString('es-PY')}`, href: '/admin/prospects' }))} /></section><section id="calidad" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold">Calidad del catálogo</h2><p className="text-sm text-slate-500">Cobertura de ubicación, contacto, precios, horarios, fotos, habitaciones y amenities.</p></div><span className="text-sm text-slate-500">Ordenado por prioridad</span></div><div className="mt-5 divide-y divide-slate-100">{incomplete.length === 0 ? <p className="py-6 text-slate-500">Todas las fichas están completas.</p> : incomplete.map((item) => <Link key={item.id} href={`/admin/motels/${item.id}`} className="grid gap-3 py-4 hover:bg-slate-50 md:grid-cols-[1fr_100px_2fr_150px] md:items-center"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-slate-500">{item.city}</p></div><strong className={item.score >= 75 ? 'text-amber-600' : 'text-rose-600'}>{item.score}%</strong><p className="text-sm text-slate-600">Falta: {item.missing.join(', ')}</p><p className="text-xs text-slate-400">Revisado {item.updatedAt.toLocaleDateString('es-PY')}</p></Link>)}</div></section></main>;
}

function Queue({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; title: string; detail: string; href: string }> }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">{title}</h2><div className="mt-3 space-y-2">{items.length === 0 ? <p className="py-4 text-sm text-slate-500">{empty}</p> : items.map((item) => <Link key={item.id} href={item.href} className="block rounded-xl bg-slate-50 p-3 hover:bg-violet-50"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></Link>)}</div></article>;
}
