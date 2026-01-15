'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
};

type MotelOption = {
  id: string;
  name: string;
};

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'advertising' | 'security' | 'maintenance'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SENT' | 'PENDING'>('ALL');
  const [motels, setMotels] = useState<MotelOption[]>([]);
  const [loadingMotels, setLoadingMotels] = useState(false);

  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'advertising',
    sendNow: true,
    scheduledDate: '',
    scheduledTime: '09:00',
    segmentType: 'ALL',
    targetRole: '',
    targetMotelId: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (formData.segmentType !== 'MOTEL' || motels.length > 0) {
      return;
    }

    const fetchMotels = async () => {
      setLoadingMotels(true);
      try {
        const res = await fetch('/api/admin/motels');
        if (!res.ok) {
          throw new Error('Error al cargar moteles');
        }
        const data = await res.json();
        setMotels((data.motels || []).map((m: any) => ({ id: m.id, name: m.name })));
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar moteles');
      } finally {
        setLoadingMotels(false);
      }
    };

    fetchMotels();
  }, [formData.segmentType, motels.length, toast]);

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const hourLabel = String(hour).padStart(2, '0');
      options.push(`${hourLabel}:00`);
      options.push(`${hourLabel}:30`);
    }
    return options;
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/schedule');
      if (!res.ok) throw new Error('Error al cargar notificaciones');
      const data = await res.json();
      const notifications = data.notifications || [];

      // Log para debugging
      console.log('📥 Notificaciones recibidas:', notifications.length);
      if (notifications.length > 0) {
        const sample = notifications.slice(0, 3).map((n: any) => ({ id: n.id, title: n.title }));
        console.log('📋 Muestra de notificaciones:', sample);
      }

      // Validar que todas las notificaciones tengan ID
      const invalidNotifications = notifications.filter((n: any) => !n.id);
      if (invalidNotifications.length > 0) {
        console.error('Notificaciones sin ID:', invalidNotifications);
      }

      setNotifications(notifications);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.body) {
      toast.warning('Título y mensaje son requeridos');
      return;
    }

    if (!formData.sendNow && !formData.scheduledDate) {
      toast.warning('Selecciona una fecha para programar o envía ahora');
      return;
    }

    if (formData.segmentType === 'ROLE' && !formData.targetRole) {
      toast.warning('Selecciona un rol para segmentar');
      return;
    }

    if (formData.segmentType === 'MOTEL' && !formData.targetMotelId) {
      toast.warning('Selecciona un motel para segmentar');
      return;
    }

    setSending(true);

    try {
      const payload: any = {
        title: formData.title,
        body: formData.body,
        category: formData.category,
        type: 'announcement',
        sendNow: formData.sendNow,
      };

      if (!formData.sendNow && formData.scheduledDate) {
        payload.scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`).toISOString();
      }

      if (formData.segmentType === 'ROLE' && formData.targetRole) {
        payload.targetRole = formData.targetRole;
      }

      if (formData.segmentType === 'MOTEL' && formData.targetMotelId) {
        payload.targetMotelId = formData.targetMotelId;
      }

      payload.data = {
        ...(payload.data || {}),
        includeGuests: formData.segmentType === 'ALL',
      };

      const res = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al enviar notificación');
      }

      const data = await res.json();

      if (formData.sendNow) {
        toast.success(`Notificación enviada: ${data.sent || 0} éxitos, ${data.failed || 0} fallos`);
      } else {
        toast.success('Notificación programada correctamente');
      }

      fetchNotifications();
      handleCancel();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar notificación');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      title: '',
      body: '',
      category: 'advertising',
      sendNow: true,
      scheduledDate: '',
      scheduledTime: '09:00',
      segmentType: 'ALL',
      targetRole: '',
      targetMotelId: '',
    });
  };

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'advertising':
        return 'bg-purple-100 text-purple-700';
      case 'security':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
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

  // Filtros
  const filteredNotifications = notifications.filter((notif) => {
    if (filterCategory !== 'ALL' && notif.category !== filterCategory) return false;
    if (filterStatus === 'SENT' && !notif.sent) return false;
    if (filterStatus === 'PENDING' && notif.sent) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-40" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-72" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-24 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notificaciones Masivas</h1>
          <p className="text-sm text-slate-600 mt-1">
            Envía notificaciones push a los usuarios de la app móvil (solo SUPERADMIN)
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Nueva Notificación
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro Categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todas las categorías</option>
            <option value="advertising">Publicidad</option>
            <option value="security">Seguridad</option>
            <option value="maintenance">Mantenimiento</option>
          </select>

          {/* Filtro Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todos los estados</option>
            <option value="SENT">Enviadas</option>
            <option value="PENDING">Pendientes</option>
          </select>
        </div>

        {/* Contadores */}
        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <span className="text-slate-600">
            Total: <span className="font-semibold text-slate-900">{filteredNotifications.length}</span>
          </span>
          <span className="text-green-600">
            Enviadas: <span className="font-semibold">{notifications.filter((n) => n.sent).length}</span>
          </span>
          <span className="text-yellow-600">
            Pendientes: <span className="font-semibold">{notifications.filter((n) => !n.sent).length}</span>
          </span>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Nueva Notificación Push</h3>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Ej: Nueva promoción disponible"
                maxLength={65}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Máximo 65 caracteres</p>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mensaje *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Escribe el contenido de la notificación..."
                rows={4}
                maxLength={240}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Máximo 240 caracteres</p>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              >
                <option value="advertising">Publicidad (puede ser desactivada por usuarios)</option>
                <option value="security">Seguridad (siempre se envía)</option>
                <option value="maintenance">Mantenimiento (siempre se envía)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.category === 'advertising'
                  ? 'Los usuarios pueden desactivar notificaciones de publicidad en su configuración'
                  : 'Esta categoría siempre se envía, independientemente de las preferencias del usuario'}
              </p>
            </div>

            {/* Envío */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                ¿Cuándo enviar?
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.sendNow}
                    onChange={() => setFormData({ ...formData, sendNow: true })}
                    className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-600"
                  />
                  <span className="text-sm text-slate-700">Enviar ahora</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.sendNow}
                    onChange={() => setFormData({ ...formData, sendNow: false })}
                    className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-600"
                  />
                  <span className="text-sm text-slate-700">Programar para después</span>
                </label>
              </div>

              {!formData.sendNow && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha y hora de envío
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      min={new Date().toISOString().slice(0, 10)}
                      required={!formData.sendNow}
                    />
                    <select
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required={!formData.sendNow}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Solo se permiten horarios en punto y media hora
                  </p>
                </div>
              )}
            </div>

            {/* Segmentación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Segmento de envío
              </label>
              <select
                value={formData.segmentType}
                onChange={(e) => setFormData({ ...formData, segmentType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="ALL">Todos los usuarios</option>
                <option value="REGISTERED">Solo registrados</option>
                <option value="ROLE">Por rol</option>
                <option value="MOTEL">Por motel favorito</option>
              </select>

              {formData.segmentType === 'ROLE' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selecciona un rol
                  </label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="USER">Usuarios</option>
                    <option value="MOTEL_ADMIN">Admins de motel</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </div>
              )}

              {formData.segmentType === 'MOTEL' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selecciona un motel
                  </label>
                  <select
                    value={formData.targetMotelId}
                    onChange={(e) => setFormData({ ...formData, targetMotelId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    disabled={loadingMotels}
                  >
                    <option value="">
                      {loadingMotels ? 'Cargando moteles...' : 'Seleccionar motel'}
                    </option>
                    {motels.map((motel) => (
                      <option key={motel.id} value={motel.id}>
                        {motel.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Vista previa</p>
              <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formData.title || 'Título de la notificación'}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {formData.body || 'Mensaje de la notificación'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    {formData.sendNow ? 'Enviar ahora' : 'Programar'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={sending}
                className="px-6 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Notificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Programada para
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Resultados
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl text-slate-300">🔔</span>
                      <p className="text-slate-500 font-medium">
                        {filterCategory !== 'ALL' || filterStatus !== 'ALL'
                          ? 'No se encontraron notificaciones con estos filtros'
                          : 'No hay notificaciones registradas'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {!showForm && 'Crea la primera usando el botón de arriba'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{notif.title}</p>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{notif.body}</p>
                        <p className="text-xs text-slate-400 mt-1">{getAudienceLabel(notif)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(notif.category)}`}>
                        {getCategoryLabel(notif.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(notif.scheduledFor).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          notif.sent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {notif.sent ? 'Enviada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {notif.sent ? (
                    <div className="space-y-0.5">
                      <p className="text-green-600">✓ Enviadas: {notif.totalSent}</p>
                      {notif.totalFailed > 0 && (
                        <p className="text-red-600">✗ Fallidas: {notif.totalFailed}</p>
                      )}
                      {notif.totalSkipped > 0 && (
                        <p className="text-slate-500">○ Omitidas: {notif.totalSkipped}</p>
                      )}
                      {notif.id ? (
                        <Link
                          href={`/admin/notifications/${notif.id}`}
                          onClick={() => console.log('🔗 Navegando a notificación con ID:', notif.id)}
                          className="inline-flex text-xs text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          Ver detalles
                        </Link>
                      ) : (
                        <span className="text-xs text-red-500">ID no disponible</span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Pendiente</span>
                      {notif.id ? (
                        <Link
                          href={`/admin/notifications/${notif.id}`}
                          onClick={() => console.log('🔗 Navegando a notificación con ID:', notif.id)}
                          className="inline-flex text-xs text-purple-600 hover:text-purple-700 font-semibold"
                        >
                          Ver detalles
                        </Link>
                      ) : (
                        <span className="text-xs text-red-500">ID no disponible</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
