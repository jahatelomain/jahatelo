'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  description: string | null;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  featuredPhoto: string | null;
  _count?: {
    photos: number;
    rooms: number;
    motelAmenities: number;
  };
};

export default function MotelsAdminPage() {
  const [motels, setMotels] = useState<Motel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<MotelStatus | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMotels();
  }, []);

  const fetchMotels = async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/admin/motels', { signal: controller.signal });
      const data = await res.json();

      // Extraer array de moteles según el shape de la respuesta
      const motelsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.motels)
        ? data.motels
        : [];

      setMotels(motelsData);
    } catch (error) {
      // Error de red, timeout o parsing - asignar array vacío sin loguear
      setMotels([]);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Asegurarse de que motels sea siempre un array
  const motelsArray = Array.isArray(motels) ? motels : [];

  const filteredMotels = motelsArray.filter((motel) => {
    // Filtro por estado (PENDING, APPROVED, REJECTED)
    if (statusFilter !== 'ALL' && motel.status !== statusFilter) return false;

    // Filtro por activo/inactivo
    if (activeFilter === 'ACTIVE' && !motel.isActive) return false;
    if (activeFilter === 'INACTIVE' && motel.isActive) return false;

    // Búsqueda por nombre, ciudad, barrio o contacto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = motel.name.toLowerCase().includes(query);
      const matchCity = motel.city.toLowerCase().includes(query);
      const matchNeighborhood = motel.neighborhood.toLowerCase().includes(query);
      const matchContact =
        (motel.contactName && motel.contactName.toLowerCase().includes(query)) ||
        (motel.contactEmail && motel.contactEmail.toLowerCase().includes(query)) ||
        (motel.contactPhone && motel.contactPhone.toLowerCase().includes(query));

      if (!matchName && !matchCity && !matchNeighborhood && !matchContact) {
        return false;
      }
    }

    return true;
  });

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
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-32" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-64" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-32 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Moteles</h1>
          <p className="text-sm text-slate-600 mt-1">Administrá todos los moteles del sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
              <span className="text-xl">⏳</span>
              <span className="text-sm font-medium text-yellow-900">
                {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Link
            href="/admin/motels/new"
            className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Motel
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Barra de búsqueda */}
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad, barrio o contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros tipo pill */}
        <div className="space-y-3">
          {/* Estado (PENDING, APPROVED, REJECTED) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado</p>
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
          </div>

          {/* Activo/Inactivo */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Visibilidad</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter('ACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'ACTIVE'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Activos <span className="ml-1 opacity-75">({motelsArray.filter((m) => m.isActive).length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'INACTIVE'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Inactivos <span className="ml-1 opacity-75">({motelsArray.filter((m) => !m.isActive).length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{filteredMotels.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{motelsArray.length}</span> moteles
          </p>
          {(searchQuery || statusFilter !== 'ALL' || activeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setActiveFilter('ALL');
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
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
                    <p className="text-slate-500 font-medium">
                      {searchQuery || statusFilter !== 'ALL' || activeFilter !== 'ALL'
                        ? 'No se encontraron moteles con estos filtros'
                        : 'No hay moteles registrados'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {searchQuery || statusFilter !== 'ALL' || activeFilter !== 'ALL'
                        ? 'Intentá con otros criterios de búsqueda'
                        : 'Los moteles aparecerán aquí cuando sean creados'}
                    </p>
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/motels/${motel.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        Editar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
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
