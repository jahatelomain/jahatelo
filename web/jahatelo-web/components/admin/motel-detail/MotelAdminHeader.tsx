import Link from 'next/link';
import { Eye, Image as ImageIcon, MapPin, MessageCircle, Phone, Trash2 } from 'lucide-react';
import type { Motel, MotelStatus } from './types';
import AdminImage from './AdminImage';
import { getGoogleMapsExternalUrl } from './formUtils';

type Props = {
  motel: Motel;
  isSuperAdmin: boolean;
  featuredPhotoWeb: string | null;
  featuredPhotoApp: string | null;
  logoUrl?: string | null;
  roomCount: number;
  promoCount: number;
  onStatusChange: (updates: { status?: MotelStatus; isActive?: boolean }) => void;
  onDelete: () => void;
};

export default function MotelAdminHeader({
  motel,
  isSuperAdmin,
  featuredPhotoWeb,
  featuredPhotoApp,
  logoUrl,
  roomCount,
  promoCount,
  onStatusChange,
  onDelete,
}: Props) {
  const whatsappLink = motel.whatsapp ? `https://wa.me/${motel.whatsapp.replace(/\D/g, '')}` : '';
  const phoneLink = motel.phone ? `tel:${motel.phone}` : '';
  const mapsLink = getGoogleMapsExternalUrl(motel.mapUrl, [motel.address, motel.city].filter(Boolean).join(', '));
  const ratingAvg = typeof motel.ratingAvg === 'number' ? motel.ratingAvg : 0;
  const ratingCount = typeof motel.ratingCount === 'number' ? motel.ratingCount : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
              motel.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : motel.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
            }`}>
              {motel.status === 'PENDING' ? 'Pendiente' : motel.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
              motel.isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <span>{motel.isActive ? '✅' : '⏸'}</span>
              {motel.isActive ? 'Habilitado' : 'Deshabilitado'}
            </span>
            {motel.plan && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-900 text-white">
                {motel.plan}
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${motel.status === 'APPROVED' && motel.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {motel.status === 'APPROVED' && motel.isActive ? 'Visible en web y apps' : 'No visible al público'}
            </span>
          </div>

          {isSuperAdmin && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select
                  value={motel.status}
                  onChange={(event) => onStatusChange({ status: event.target.value as MotelStatus })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="APPROVED">Aprobado</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Habilitado</label>
                <select
                  value={motel.isActive ? 'true' : 'false'}
                  onChange={(event) => onStatusChange({ isActive: event.target.value === 'true' })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">{motel.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {motel.country && <><span>{motel.country}</span><span className="text-slate-300">•</span></>}
              <span>{motel.city}</span>
              {motel.address && <><span className="text-slate-300">•</span><span>{motel.address}</span></>}
            </div>
            {motel.description && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{motel.description}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/motels/${motel.id}/preview`} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100">
              <Eye className="h-3.5 w-3.5" /> Previsualizar web y app
            </Link>
            {mapsLink && (
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-purple-200 hover:text-purple-700 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> Ver mapa
              </a>
            )}
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {phoneLink && (
              <a href={phoneLink} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-purple-200 hover:text-purple-700 transition-colors">
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
            )}
            {isSuperAdmin && (
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {featuredPhotoWeb || featuredPhotoApp ? (
            <AdminImage src={featuredPhotoWeb || featuredPhotoApp || ''} alt={motel.name} className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-400">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          {(featuredPhotoWeb || featuredPhotoApp) && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/60 to-transparent" />}
          {logoUrl && (
            <div className="absolute left-4 top-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-950 p-1 shadow-lg">
              <AdminImage src={logoUrl} alt={`Logo de ${motel.name}`} width={64} height={64} className="h-full w-full rounded-full object-contain" />
            </div>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Calificación</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{ratingAvg.toFixed(1)} <span className="text-sm font-medium text-slate-500">({ratingCount})</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Habitaciones</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{roomCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Promos activas</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{promoCount}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Creado el {motel.createdAt ? new Date(motel.createdAt).toLocaleDateString('es-AR') : '—'} · Última actualización {motel.updatedAt ? new Date(motel.updatedAt).toLocaleDateString('es-AR') : 'reciente'}
        </p>
      </div>
    </div>
  );
}
