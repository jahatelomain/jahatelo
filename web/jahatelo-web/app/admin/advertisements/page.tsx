'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

const placementLabels: Record<string, string> = {
  POPUP_HOME: 'Popup Home',
  CAROUSEL: 'Carrusel',
  SECTION_BANNER: 'Banner de sección',
  LIST_INLINE: 'Inline en listado',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  INACTIVE: 'Inactivo',
};

type Advertisement = {
  id: string;
  title: string;
  advertiser: string;
  placement: string;
  status: string;
  priority: number;
  viewCount: number;
  clickCount: number;
  createdAt: string;
};

export default function AdvertisementsAdminPage() {
  const toast = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/admin/advertisements');
      if (!res.ok) throw new Error('Error al cargar anuncios');
      const data = await res.json();
      setAds(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      const res = await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar anuncio');
      toast.success('Anuncio eliminado');
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar anuncio');
    }
  };

  const handleToggleStatus = async (ad: Advertisement) => {
    try {
      const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      toast.success('Estado actualizado');
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Publicidad</h2>
          <p className="text-slate-500">Gestiona anuncios y revisa su rendimiento.</p>
        </div>
        <Link
          href="/admin/advertisements/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          + Nuevo anuncio
        </Link>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Anuncio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ubicación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vistas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Clicks</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ads.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                    No hay anuncios cargados.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ad.title}</div>
                      <div className="text-sm text-slate-500">{ad.advertiser}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {placementLabels[ad.placement] || ad.placement}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          ad.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ad.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {statusLabels[ad.status] || ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ad.priority}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ad.viewCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ad.clickCount}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/advertisements/${ad.id}`}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/advertisements/${ad.id}/analytics`}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Analytics
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(ad)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          {ad.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
