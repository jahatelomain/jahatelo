'use client';

import { useEffect, useState } from 'react';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  } | null;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getAuditLink = (log: AuditLog) => {
    const metadata = log.metadata || {};
    const motelId = typeof metadata.motelId === 'string' ? metadata.motelId : null;

    switch (log.entityType) {
      case 'Motel':
        return log.entityId ? `/admin/motels/${log.entityId}` : null;
      case 'MotelFinanzas':
        return log.entityId ? `/admin/financiero/${log.entityId}` : null;
      case 'PaymentHistory':
        return motelId ? `/admin/financiero/${motelId}` : null;
      case 'Advertisement':
        return log.entityId ? `/admin/banners/${log.entityId}` : '/admin/banners';
      case 'Promo':
        return '/admin/promos';
      case 'Amenity':
        return '/admin/amenities';
      case 'Prospect':
        return '/admin/prospects';
      case 'User':
        return '/admin/users';
      case 'Room':
      case 'RoomPhoto':
      case 'MenuCategory':
      case 'MenuItem':
        return motelId ? `/admin/motels/${motelId}` : '/admin/motels';
      default:
        return null;
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);
      if (userFilter) params.set('userId', userFilter);
      if (searchQuery) params.set('q', searchQuery);

      const queryString = params.toString();
      const response = await fetch(`/api/admin/audit${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setErrorMessage(error.error || 'No se pudo cargar la auditoría');
        setLogs([]);
        return;
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setErrorMessage('No se pudo cargar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueUsers = Array.from(
    new Map(
      logs
        .filter((log) => log.user?.id)
        .map((log) => [log.user?.id, log.user])
    ).values()
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-500">Cargando auditoría...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-600 mt-1">Últimos cambios registrados</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Acción</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
            <input
              type="text"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Ej: Motel, Promo"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todos</option>
              {uniqueUsers.map((user) => (
                <option key={user?.id} value={user?.id}>
                  {user?.name || user?.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Texto libre"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Aplicar filtros
          </button>
          <button
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
              setUserFilter('');
              setSearchQuery('');
              fetchLogs();
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Limpiar
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acción
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Entidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Sin registros de auditoría.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(log.createdAt).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {log.user?.name || log.user?.email || 'Sistema'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {(() => {
                      const link = getAuditLink(log);
                      const label = log.entityId || 'Ver';
                      if (!link) return log.entityId || '-';
                      return (
                        <a
                          href={link}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {label}
                        </a>
                      );
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
