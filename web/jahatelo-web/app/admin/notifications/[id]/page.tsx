'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

type ScheduledNotification = {
  id: string;
  title: string;
  body: string;
  category: string;
  type: string;
  data?: any;
  scheduledFor: string;
  sent: boolean;
  sentAt: string | null;
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  targetRole?: string | null;
  targetMotelId?: string | null;
  targetUserIds?: string[] | null;
  createdAt: string;
  errorMessage: string | null;
};

export default function NotificationDetailPage({ params }: { params: { id: string } }) {
  const [notification, setNotification] = useState<ScheduledNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const res = await fetch(`/api/notifications/${params.id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al cargar notificación');
        }
        const data = await res.json();
        setNotification(data.notification || null);
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar notificación');
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [params.id]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'advertising':
        return 'Publicidad';
      case 'security':
        return 'Seguridad';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return category;
    }
  };

  const getAudienceLabel = (notif: ScheduledNotification) => {
    if (notif.targetUserIds && notif.targetUserIds.length > 0) {
      return 'Usuarios específicos';
    }
    if (notif.targetRole) {
      return notif.targetRole === 'SUPERADMIN'
        ? 'Solo superadmin'
        : notif.targetRole === 'MOTEL_ADMIN'
          ? 'Solo admins de motel'
          : 'Solo usuarios';
    }
    if (notif.targetMotelId) {
      return 'Favoritos de un motel';
    }
    if (notif.data?.includeGuests) {
      return 'Todos los usuarios';
    }
    return 'Solo registrados';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-500">Cargando notificación...</div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-8 space-y-3">
        <div className="text-slate-500">No se encontró la notificación</div>
        <Link href="/admin/notifications" className="text-purple-600 hover:text-purple-700">
          Volver a notificaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Detalle de notificación</h1>
          <p className="text-sm text-slate-600 mt-1">{notification.title}</p>
        </div>
        <Link
          href="/admin/notifications"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Volver
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase text-slate-500 font-semibold">Mensaje</p>
          <p className="text-slate-900 mt-1">{notification.body}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Categoría</p>
            <p className="text-slate-900 font-medium">{getCategoryLabel(notification.category)}</p>
          </div>
          <div>
            <p className="text-slate-500">Estado</p>
            <p className="text-slate-900 font-medium">{notification.sent ? 'Enviada' : 'Pendiente'}</p>
          </div>
          <div>
            <p className="text-slate-500">Programada para</p>
            <p className="text-slate-900 font-medium">
              {new Date(notification.scheduledFor).toLocaleString('es-AR')}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Enviada en</p>
            <p className="text-slate-900 font-medium">
              {notification.sentAt ? new Date(notification.sentAt).toLocaleString('es-AR') : 'No enviada'}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Segmento</p>
            <p className="text-slate-900 font-medium">{getAudienceLabel(notification)}</p>
          </div>
        </div>

        {notification.errorMessage && (
          <div className="text-sm text-red-600">
            {notification.errorMessage}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Resultados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-semibold">Enviadas</p>
            <p className="text-2xl font-bold text-green-800">{notification.totalSent}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">Fallidas</p>
            <p className="text-2xl font-bold text-red-800">{notification.totalFailed}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-slate-700 font-semibold">Omitidas</p>
            <p className="text-2xl font-bold text-slate-800">{notification.totalSkipped}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
