'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type PendingMotel = {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  createdAt: Date;
};

type QuickActionsProps = {
  initialMotels: PendingMotel[];
};

export default function QuickActions({ initialMotels }: QuickActionsProps) {
  const router = useRouter();
  const [motels, setMotels] = useState(initialMotels);
  const [loading, setLoading] = useState<string | null>(null);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
    if (diffInHours > 0) return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    return 'hace un momento';
  };

  const handleQuickApprove = async (motelId: string) => {
    setLoading(motelId);
    try {
      const res = await fetch(`/api/admin/motels/${motelId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al aprobar');
      }

      // Remover de la lista
      setMotels(motels.filter((m) => m.id !== motelId));
      toast.success('Motel aprobado exitosamente');

      // Refrescar página para actualizar contadores
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aprobar motel');
    } finally {
      setLoading(null);
    }
  };

  const handleQuickReject = async (motelId: string) => {
    if (!confirm('¿Estás seguro de rechazar este motel? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(motelId);
    try {
      const res = await fetch(`/api/admin/motels/${motelId}/reject`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al rechazar');
      }

      // Remover de la lista
      setMotels(motels.filter((m) => m.id !== motelId));
      toast.success('Motel rechazado');

      // Refrescar página para actualizar contadores
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al rechazar motel');
    } finally {
      setLoading(null);
    }
  };

  if (motels.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>

        <div className="text-center py-8">
          <span className="text-5xl mb-3 block">✨</span>
          <p className="text-slate-600 font-medium mb-1">Todo en orden</p>
          <p className="text-sm text-slate-500">No hay moteles pendientes de aprobación</p>
        </div>

        {/* Quick Create Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link
            href="/admin/promos"
            className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl">🎁</span>
            <span className="text-sm font-medium">Nueva Promo</span>
          </Link>
          <Link
            href="/admin/banners/new"
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl">📢</span>
            <span className="text-sm font-medium">Nuevo Banner</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>

        {/* Pending Motels */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-slate-600 mb-3">
            {motels.length} motel{motels.length !== 1 ? 'es' : ''} esperando aprobación:
          </p>
          {motels.map((motel) => (
            <div
              key={motel.id}
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{motel.name}</p>
                <p className="text-xs text-slate-600">
                  {motel.city} • {motel.neighborhood} • Registrado {getTimeAgo(motel.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleQuickApprove(motel.id)}
                  disabled={loading === motel.id}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === motel.id ? '...' : '✓ Aprobar'}
                </button>
                <button
                  onClick={() => handleQuickReject(motel.id)}
                  disabled={loading === motel.id}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === motel.id ? '...' : '✕ Rechazar'}
                </button>
                <Link
                  href={`/admin/motels/${motel.id}`}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Ver →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Create Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/admin/promos"
            className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl">🎁</span>
            <span className="text-sm font-medium">Nueva Promo</span>
          </Link>
          <Link
            href="/admin/banners/new"
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl">📢</span>
            <span className="text-sm font-medium">Nuevo Banner</span>
          </Link>
        </div>
      </div>
    </>
  );
}
