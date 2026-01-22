'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import Link from 'next/link';
import PaginationControls from '../components/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';

type PaymentType = 'DIRECT_DEBIT' | 'TRANSFER' | 'EXCHANGE';
type FinancialStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

interface Motel {
  id: string;
  name: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FinancialStatus>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentType>('ALL');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{
    statusCounts: Record<string, number>;
    paymentCounts: Record<string, number>;
  }>({ statusCounts: {}, paymentCounts: {} });
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const nextKey = `${statusFilter}|${paymentFilter}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchMotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, paymentFilter, debouncedSearchQuery, currentUser]);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

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

  const fetchMotels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (paymentFilter !== 'ALL') params.set('payment', paymentFilter);
      if (debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
      const response = await fetch(`/api/admin/financiero?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const motelsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const meta = Array.isArray(data) ? undefined : data?.meta;
        setMotels(motelsData);
        setTotalItems(meta?.total ?? motelsData.length);
        setSummary({
          statusCounts: meta?.summary?.statusCounts ?? {},
          paymentCounts: meta?.summary?.paymentCounts ?? {},
        });
      } else {
        toast?.showToast('Error al cargar moteles', 'error');
      }
    } catch (error) {
      console.error('Error fetching motels:', error);
      toast?.showToast('Error al cargar moteles', 'error');
    } finally {
      setLoading(false);
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
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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
        <div className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{totalItems}</span> moteles
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, razón social o contacto..."
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

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado financiero</p>
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
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Activos <span className="ml-1 opacity-75">({summary.statusCounts.ACTIVE ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-yellow-600 text-white shadow-md shadow-yellow-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-yellow-300'
                }`}
              >
                Inactivos <span className="ml-1 opacity-75">({summary.statusCounts.INACTIVE ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('DISABLED')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'DISABLED'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
                }`}
              >
                Inhabilitados <span className="ml-1 opacity-75">({summary.statusCounts.DISABLED ?? 0})</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tipo de cobro</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPaymentFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPaymentFilter('DIRECT_DEBIT')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentFilter === 'DIRECT_DEBIT'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-300'
                }`}
              >
                Débito automático
              </button>
              <button
                onClick={() => setPaymentFilter('TRANSFER')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentFilter === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-300'
                }`}
              >
                Transferencia
              </button>
              <button
                onClick={() => setPaymentFilter('EXCHANGE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentFilter === 'EXCHANGE'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-300'
                }`}
              >
                Canje
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{motelsArray.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> moteles
          </p>
          {(searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
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
    </div>
  );
}
