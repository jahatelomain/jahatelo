'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type PaymentType = 'DIRECT_DEBIT' | 'TRANSFER' | 'EXCHANGE';
type FinancialStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';
type MotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Motel {
  id: string;
  name: string;
  city: string;
  billingDay: number | null;
  paymentType: PaymentType | null;
  financialStatus: FinancialStatus;
  billingCompanyName: string | null;
  billingTaxId: string | null;
  adminContactName: string | null;
  adminContactEmail: string | null;
  adminContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
  motelId?: string | null;
}

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  DIRECT_DEBIT: 'Débito automático',
  TRANSFER: 'Transferencia',
  EXCHANGE: 'Canje',
};

const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DISABLED: 'Inhabilitado',
};

const FINANCIAL_STATUS_COLORS: Record<FinancialStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-yellow-100 text-yellow-800',
  DISABLED: 'bg-red-100 text-red-800',
};

export default function FinancieroPage() {
  const router = useRouter();
  const toast = useToast();
  const [motels, setMotels] = useState<Motel[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Motel[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | MotelStatus>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{
    statusCounts: Record<string, number>;
    activeCounts: Record<string, number>;
  }>({ statusCounts: {}, activeCounts: {} });
  const pageSize = 20;
  const hasMore = motels.length < totalItems;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const nextKey = `${statusFilter}|${activeFilter}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const isLoadingMore = page > 1;
    fetchMotels(isLoadingMore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, activeFilter, currentUser]);

  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    if (query.length < 3) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const params = new URLSearchParams({ search: query, page: '1', limit: '8' });
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (activeFilter === 'ACTIVE') params.set('active', 'true');
        if (activeFilter === 'INACTIVE') params.set('active', 'false');
        const response = await fetch(`/api/admin/financiero?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || controller.signal.aborted) return;
        setSearchSuggestions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') setSearchSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
    return () => controller.abort();
  }, [debouncedSearchQuery, statusFilter, activeFilter]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.user) {
        router.push('/admin');
        return;
      }

      if (data.user.role === 'MOTEL_ADMIN') {
        if (!data.user.motelId) {
          router.push('/admin');
          return;
        }
        router.replace(`/admin/financiero/${data.user.motelId}`);
        return;
      }

      if (data.user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return;
      }

      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
    }
  };

  const fetchMotels = async (isLoadingMore = false) => {
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (activeFilter !== 'ALL') params.set('active', activeFilter === 'ACTIVE' ? 'true' : 'false');
      const response = await fetch(`/api/admin/financiero?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const motelsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const meta = Array.isArray(data) ? undefined : data?.meta;
        setMotels((prev) => (isLoadingMore ? [...prev, ...motelsData] : motelsData));
        setTotalItems(meta?.total ?? motelsData.length);
        setSummary({
          statusCounts: meta?.summary?.statusCounts ?? {},
          activeCounts: meta?.summary?.activeCounts ?? {},
        });
      } else {
        if (!isLoadingMore) {
          toast?.showToast('Error al cargar moteles', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching motels:', error);
      if (!isLoadingMore) {
        toast?.showToast('Error al cargar moteles', 'error');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Financiero</h1>
        <TableSkeleton />
      </div>
    );
  }

  const motelsArray = Array.isArray(motels) ? motels : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Financiero</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de facturación y cobros de moteles
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{totalItems}</span> moteles
          </div>
          <a
            href="/api/admin/export?type=financiero"
            download
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2 shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </a>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad o contacto..."
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
              {searchQuery.trim().length >= 3 && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {suggestionsLoading ? (
                    <p className="px-4 py-3 text-sm text-slate-500">Buscando moteles...</p>
                  ) : searchSuggestions.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {searchSuggestions.map((motel) => (
                        <li key={motel.id}>
                          <Link
                            href={`/admin/financiero/${motel.id}`}
                            className="block px-4 py-3 transition-colors hover:bg-purple-50"
                          >
                            <p className="text-sm font-semibold text-slate-900">{motel.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {[motel.city, motel.adminContactName || motel.billingCompanyName].filter(Boolean).join(' · ')}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-500">No encontramos moteles con ese criterio.</p>
                  )}
                </div>
              )}
            </div>
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="mt-2 text-xs text-slate-500">Escribí al menos 3 caracteres para buscar.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
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
                Todos <span className="ml-1 opacity-75">({totalItems})</span>
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-yellow-600 text-white shadow-md shadow-yellow-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-yellow-300'
                }`}
              >
                Pendientes <span className="ml-1 opacity-75">({summary.statusCounts.PENDING ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'APPROVED'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Aprobados <span className="ml-1 opacity-75">({summary.statusCounts.APPROVED ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'REJECTED'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
                }`}
              >
                Rechazados <span className="ml-1 opacity-75">({summary.statusCounts.REJECTED ?? 0})</span>
              </button>
            </div>
          </div>

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
                Habilitados <span className="ml-1 opacity-75">({summary.activeCounts.active ?? 0})</span>
              </button>
              <button
                onClick={() => setActiveFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'INACTIVE'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Deshabilitados <span className="ml-1 opacity-75">({summary.activeCounts.inactive ?? 0})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-200">
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Fecha de cobro
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tipo de cobro
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {motelsArray.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hay moteles registrados
                  </td>
                </tr>
              ) : (
                motelsArray.map((motel) => (
                  <tr key={motel.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {motel.name}
                      </div>
                      {motel.adminContactName && (
                        <div className="text-xs text-slate-500">
                          Contacto: {motel.adminContactName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {motel.billingDay ? `${motel.billingDay} de cada mes` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {motel.paymentType ? PAYMENT_TYPE_LABELS[motel.paymentType] : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          FINANCIAL_STATUS_COLORS[motel.financialStatus]
                        }`}
                      >
                        {FINANCIAL_STATUS_LABELS[motel.financialStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/financiero/${motel.id}`}
                        className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel y loader */}
        {motelsArray.length > 0 && (
          <div ref={sentinelRef} className="px-6 pb-6">
            {loadingMore && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Cargando más moteles...</span>
              </div>
            )}
            {!hasMore && totalItems > pageSize && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">
                  Mostrando todos los moteles ({motelsArray.length} de {totalItems})
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
