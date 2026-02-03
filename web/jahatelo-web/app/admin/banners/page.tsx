'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const placementLabels: Record<string, string> = {
  POPUP_HOME: 'Popup Home',
  CAROUSEL: 'Carrusel',
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

type CurrentUser = {
  id: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
};

export default function AdvertisementsAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const hasMore = ads.length < totalItems;
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const fetchAds = async (isLoadingMore = false) => {
    if (!currentUser) return;
    if (isLoadingMore) {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      const res = await fetch(`/api/admin/banners?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar anuncios');
      const data = await res.json();
      const adsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      const meta = Array.isArray(data) ? undefined : data?.meta;
      setAds((prev) => (isLoadingMore ? [...prev, ...adsData] : adsData));
      setTotalItems(meta?.total ?? adsData.length);
    } catch (error) {
      console.error('Error:', error);
      if (!isLoadingMore) {
        toast.error('Error al cargar anuncios');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const isLoadingMore = page > 1;
    fetchAds(isLoadingMore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, currentUser]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

  const checkAccess = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user || data.user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return;
      }
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
    }
  };


  const handleDelete = async (id: string) => {
    setConfirmAction({
      title: 'Eliminar anuncio',
      message: '¿Eliminar este anuncio? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Error al eliminar anuncio');
          toast.success('Anuncio eliminado');
          fetchAds();
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error al eliminar anuncio');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleToggleStatus = async (ad: Advertisement) => {
    try {
      const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`/api/admin/banners/${ad.id}`, {
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
          href="/admin/banners/new"
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
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/banners/${ad.id}`}
                          className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                        >
                          Editar
                        </Link>
                        <details className="relative">
                          <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                          </summary>
                          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                            <Link
                              href={`/admin/banners/${ad.id}/analytics`}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Analytics
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(ad)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {ad.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDelete(ad.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Infinite scroll sentinel y loader */}
          {ads.length > 0 && (
            <div ref={sentinelRef} className="px-6 pb-6">
              {loadingMore && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-600">Cargando más anuncios...</span>
                </div>
              )}
              {!hasMore && totalItems > pageSize && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">
                    Mostrando todos los anuncios ({ads.length} de {totalItems})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText}
        cancelText={confirmAction?.cancelText}
        danger={confirmAction?.danger}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </div>
  );
}
