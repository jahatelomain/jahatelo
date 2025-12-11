'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type Motel = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  status: MotelStatus;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export default function MotelsAdminPage() {
  const [motels, setMotels] = useState<Motel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<MotelStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchMotels();
  }, []);

  const fetchMotels = async () => {
    try {
      const res = await fetch('/api/admin/motels');
      const data = await res.json();

      // Extraer array de moteles según el shape de la respuesta
      const motelsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.motels)
        ? data.motels
        : [];

      setMotels(motelsData);
    } catch (error) {
      // Error de red o parsing - asignar array vacío sin loguear
      setMotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Asegurarse de que motels sea siempre un array
  const motelsArray = Array.isArray(motels) ? motels : [];

  const filteredMotels = statusFilter === 'ALL'
    ? motelsArray
    : motelsArray.filter((m) => m.status === statusFilter);

  const getStatusBadge = (status: MotelStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };

    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const pendingCount = motelsArray.filter((m) => m.status === 'PENDING').length;

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Moteles</h1>
          <p className="text-sm text-slate-600 mt-1">Administrá todos los moteles del sistema</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
            <span className="text-xl">⏳</span>
            <span className="text-sm font-medium text-yellow-900">
              {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filtros tipo pill */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            statusFilter === 'ALL'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-300'
          }`}
        >
          Todos <span className="ml-1 opacity-75">({motelsArray.length})</span>
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-yellow-600 text-white shadow-md shadow-yellow-200'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-yellow-300'
          }`}
        >
          Pendientes <span className="ml-1 opacity-75">({motelsArray.filter((m) => m.status === 'PENDING').length})</span>
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            statusFilter === 'APPROVED'
              ? 'bg-green-600 text-white shadow-md shadow-green-200'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
          }`}
        >
          Aprobados <span className="ml-1 opacity-75">({motelsArray.filter((m) => m.status === 'APPROVED').length})</span>
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            statusFilter === 'REJECTED'
              ? 'bg-red-600 text-white shadow-md shadow-red-200'
              : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
          }`}
        >
          Rechazados <span className="ml-1 opacity-75">({motelsArray.filter((m) => m.status === 'REJECTED').length})</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Activo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredMotels.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl text-slate-300">🔍</span>
                    <p className="text-slate-500 font-medium">No hay moteles con este filtro</p>
                    <p className="text-sm text-slate-400">Intentá con otro filtro</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMotels.map((motel) => (
                <tr key={motel.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{motel.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {motel.neighborhood}, {motel.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {motel.contactName || motel.contactEmail || motel.contactPhone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(motel.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        motel.isActive
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {motel.isActive ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/motels/${motel.id}`}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Ver detalle
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
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
