'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TableSkeleton } from '@/components/SkeletonLoader';
import MotelCard from '../components/MotelCard';
import PaginationControls from '../components/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedMotels, setSelectedMotels] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{
    statusCounts: Record<string, number>;
    activeCounts: Record<string, number>;
  }>({ statusCounts: {}, activeCounts: {} });
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const fetchMotels = async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (activeFilter === 'ACTIVE') params.set('active', 'true');
      if (activeFilter === 'INACTIVE') params.set('active', 'false');
      const res = await fetch(`/api/admin/motels?${params.toString()}`, { signal: controller.signal });
      const data = await res.json();

      const motelsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.motels)
        ? data.motels
        : [];
      const meta = Array.isArray(data) ? undefined : data?.meta;

      setMotels(motelsData);
      setTotalItems(meta?.total ?? motelsData.length);
      setSummary(meta?.summary ?? { statusCounts: {}, activeCounts: {} });
    } catch (error) {
      // Error de red, timeout o parsing - asignar array vacío sin loguear
      setMotels([]);
      setTotalItems(0);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextKey = `${statusFilter}|${activeFilter}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchMotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, activeFilter, debouncedSearchQuery]);

  const motelsArray = Array.isArray(motels) ? motels : [];
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const allPageSelected =
    motelsArray.length > 0 && motelsArray.every((motel) => selectedMotels.has(motel.id));

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

  const pendingCount = summary.statusCounts.PENDING ?? 0;
  const approvedCount = summary.statusCounts.APPROVED ?? 0;
  const rejectedCount = summary.statusCounts.REJECTED ?? 0;
  const activeCount = summary.activeCounts.active ?? 0;
  const inactiveCount = summary.activeCounts.inactive ?? 0;

  // Bulk actions handlers
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedMotels(new Set());
    } else {
      setSelectedMotels(new Set(motelsArray.map((m) => m.id)));
    }
  };

  const toggleSelectMotel = (id: string) => {
    const newSelected = new Set(selectedMotels);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMotels(newSelected);
  };

  const handleBulkApprove = async () => {
    if (!confirm(`¿Aprobar ${selectedMotels.size} motel(es)?`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/motels/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedMotels) }),
      });

      if (!res.ok) throw new Error('Error al aprobar moteles');

      await fetchMotels();
      setSelectedMotels(new Set());
      alert('Moteles aprobados exitosamente');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al aprobar moteles');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!confirm(`¿RECHAZAR ${selectedMotels.size} motel(es)? Esta acción no se puede deshacer.`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/motels/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedMotels) }),
      });

      if (!res.ok) throw new Error('Error al rechazar moteles');

      await fetchMotels();
      setSelectedMotels(new Set());
      alert('Moteles rechazados');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al rechazar moteles');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (!confirm(`¿Activar ${selectedMotels.size} motel(es)?`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/motels/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedMotels), isActive: true }),
      });

      if (!res.ok) throw new Error('Error al activar moteles');

      await fetchMotels();
      setSelectedMotels(new Set());
      alert('Moteles activados exitosamente');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al activar moteles');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`¿Desactivar ${selectedMotels.size} motel(es)?`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/motels/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedMotels), isActive: false }),
      });

      if (!res.ok) throw new Error('Error al desactivar moteles');

      await fetchMotels();
      setSelectedMotels(new Set());
      alert('Moteles desactivados exitosamente');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al desactivar moteles');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿ELIMINAR ${selectedMotels.size} motel(es)? Esta acción no se puede deshacer.`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/motels/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedMotels) }),
      });

      if (!res.ok) throw new Error('Error al eliminar moteles');

      await fetchMotels();
      setSelectedMotels(new Set());
      alert('Moteles eliminados');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar moteles');
    } finally {
      setBulkLoading(false);
    }
  };

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

          {/* Toggle de vista Lista/Grid */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grilla
            </button>
          </div>

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
                Pendientes <span className="ml-1 opacity-75">({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'APPROVED'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Aprobados <span className="ml-1 opacity-75">({approvedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'REJECTED'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
                }`}
              >
                Rechazados <span className="ml-1 opacity-75">({rejectedCount})</span>
              </button>
            </div>
          </div>

          {/* Habilitado/Deshabilitado */}
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
                Habilitados <span className="ml-1 opacity-75">({activeCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'INACTIVE'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Deshabilitados <span className="ml-1 opacity-75">({inactiveCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{motelsArray.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> moteles
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

      {/* Toolbar de acciones bulk */}
      {selectedMotels.size > 0 && viewMode === 'list' && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-slate-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">
                {selectedMotels.size} seleccionado{selectedMotels.size !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-600" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aprobar
              </button>

              <button
                onClick={handleBulkReject}
                disabled={bulkLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazar
              </button>

              <button
                onClick={handleBulkActivate}
                disabled={bulkLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Activar
              </button>

              <button
                onClick={handleBulkDeactivate}
                disabled={bulkLoading}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Desactivar
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14" />
                </svg>
                Eliminar
              </button>

              <div className="h-6 w-px bg-slate-600" />

              <button
                onClick={() => setSelectedMotels(new Set())}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista Lista (Tabla) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
              </th>
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
                Habilitado
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {motelsArray.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
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
              motelsArray.map((motel) => (
                <tr key={motel.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedMotels.has(motel.id)}
                      onChange={() => toggleSelectMotel(motel.id)}
                      className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 max-w-[220px] truncate">
                    {motel.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 max-w-[240px] truncate">
                    {motel.neighborhood}, {motel.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 max-w-[180px] truncate">
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
                      {motel.isActive ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[120px]">
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
          {totalItems > 0 && (
            <div className="px-6 pb-6">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Vista Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motelsArray.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-4 py-12">
              <span className="text-6xl text-slate-300">🔍</span>
              <p className="text-slate-500 font-medium text-lg">
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
          ) : (
            motelsArray.map((motel) => (
              <MotelCard key={motel.id} motel={motel} />
            ))
          )}
        </div>
      )}
      {viewMode === 'grid' && totalItems > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
