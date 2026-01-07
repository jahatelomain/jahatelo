'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import Link from 'next/link';

type PaymentType = 'DIRECT_DEBIT' | 'TRANSFER' | 'EXCHANGE';
type FinancialStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

interface Motel {
  id: string;
  name: string;
  billingDay: number | null;
  paymentType: PaymentType | null;
  financialStatus: FinancialStatus;
  isFinanciallyEnabled: boolean;
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

  useEffect(() => {
    checkAccess();
    fetchMotels();
  }, []);

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
      const response = await fetch('/api/admin/financiero');
      if (response.ok) {
        const data = await response.json();
        setMotels(data);
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
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Financiero</h1>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financiero</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de facturación y cobros de moteles
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{motels.length}</span> moteles
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de cobro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de cobro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {motels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay moteles registrados
                  </td>
                </tr>
              ) : (
                motels.map((motel) => (
                  <tr key={motel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {motel.name}
                      </div>
                      {motel.adminContactName && (
                        <div className="text-xs text-gray-500">
                          Contacto: {motel.adminContactName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {motel.billingDay ? `${motel.billingDay} de cada mes` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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
                        className="text-purple-600 hover:text-purple-800 font-medium"
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
      </div>
    </div>
  );
}
