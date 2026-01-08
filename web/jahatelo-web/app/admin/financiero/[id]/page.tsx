'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

type PaymentType = 'DIRECT_DEBIT' | 'TRANSFER' | 'EXCHANGE';
type FinancialStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';
type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

interface Motel {
  id: string;
  name: string;
  slug: string;
  billingDay: number | null;
  paymentType: PaymentType | null;
  financialStatus: FinancialStatus;
  isFinanciallyEnabled: boolean;
  billingCompanyName: string | null;
  billingTaxId: string | null;
  adminContactName: string | null;
  adminContactEmail: string | null;
  adminContactPhone: string | null;
  paymentHistory?: PaymentHistory[];
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  paidAt: string;
  status: PaymentStatus;
  paymentType: PaymentType | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  DIRECT_DEBIT: 'Débito automático',
  TRANSFER: 'Transferencia',
  EXCHANGE: 'Canje',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
};

export default function EditFinancieroPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [motel, setMotel] = useState<Motel | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  const [formData, setFormData] = useState({
    billingDay: '',
    paymentType: '',
    financialStatus: 'ACTIVE' as FinancialStatus,
    isFinanciallyEnabled: true,
    billingCompanyName: '',
    billingTaxId: '',
    adminContactName: '',
    adminContactEmail: '',
    adminContactPhone: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'PYG',
    paidAt: '',
    status: 'PAID' as PaymentStatus,
    paymentType: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    if (params?.id) {
      fetchMotel(params.id as string);
    }
  }, [params?.id]);

  const fetchMotel = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/financiero/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMotel(data);
        setPaymentHistory(data.paymentHistory || []);
        setFormData({
          billingDay: data.billingDay?.toString() || '',
          paymentType: data.paymentType || '',
          financialStatus: data.financialStatus || 'ACTIVE',
          isFinanciallyEnabled: data.isFinanciallyEnabled ?? true,
          billingCompanyName: data.billingCompanyName || '',
          billingTaxId: data.billingTaxId || '',
          adminContactName: data.adminContactName || '',
          adminContactEmail: data.adminContactEmail || '',
          adminContactPhone: data.adminContactPhone || '',
        });
      } else {
        toast?.showToast('Error al cargar motel', 'error');
        router.push('/admin/financiero');
      }
    } catch (error) {
      console.error('Error fetching motel:', error);
      toast?.showToast('Error al cargar motel', 'error');
      router.push('/admin/financiero');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentForm.amount) {
      toast?.showToast('El monto es obligatorio', 'error');
      return;
    }

    try {
      setAddingPayment(true);
      const response = await fetch(`/api/admin/financiero/${params?.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          currency: paymentForm.currency || 'PYG',
          paidAt: paymentForm.paidAt || null,
          status: paymentForm.status,
          paymentType: paymentForm.paymentType || null,
          reference: paymentForm.reference || null,
          notes: paymentForm.notes || null,
        }),
      });

      if (response.ok) {
        const newPayment = await response.json();
        setPaymentHistory((prev) => [newPayment, ...prev]);
        setPaymentForm({
          amount: '',
          currency: 'PYG',
          paidAt: '',
          status: 'PAID',
          paymentType: '',
          reference: '',
          notes: '',
        });
        toast?.showToast('Pago registrado', 'success');
      } else {
        const error = await response.json();
        toast?.showToast(error.error || 'Error al registrar pago', 'error');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast?.showToast('Error al registrar pago', 'error');
    } finally {
      setAddingPayment(false);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: currency || 'PYG',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${amount} ${currency || 'PYG'}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/financiero/${params?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingDay: formData.billingDay ? parseInt(formData.billingDay) : null,
          paymentType: formData.paymentType || null,
          financialStatus: formData.financialStatus,
          isFinanciallyEnabled: formData.isFinanciallyEnabled,
          billingCompanyName: formData.billingCompanyName || null,
          billingTaxId: formData.billingTaxId || null,
          adminContactName: formData.adminContactName || null,
          adminContactEmail: formData.adminContactEmail || null,
          adminContactPhone: formData.adminContactPhone || null,
        }),
      });

      if (response.ok) {
        toast?.showToast('Datos actualizados correctamente', 'success');
        router.push('/admin/financiero');
      } else {
        const error = await response.json();
        toast?.showToast(error.error || 'Error al actualizar datos', 'error');
      }
    } catch (error) {
      console.error('Error updating motel:', error);
      toast?.showToast('Error al actualizar datos', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!motel) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Motel no encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/financiero"
          className="text-purple-600 hover:text-purple-800 text-sm mb-2 inline-block"
        >
          ← Volver a Financiero
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{motel.name}</h1>
        <p className="text-sm text-gray-600 mt-1">Editar datos financieros y de contacto</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de cobro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Cobro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día de cobro (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.billingDay}
                onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cobro
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="DIRECT_DEBIT">Débito automático</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="EXCHANGE">Canje</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status financiero
              </label>
              <select
                value={formData.financialStatus}
                onChange={(e) =>
                  setFormData({ ...formData, financialStatus: e.target.value as FinancialStatus })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="DISABLED">Inhabilitado</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFinanciallyEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isFinanciallyEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Habilitado financieramente
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Datos de facturación */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Facturación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.billingCompanyName}
                onChange={(e) => setFormData({ ...formData, billingCompanyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Empresa S.A."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nro. de RUC
              </label>
              <input
                type="text"
                value={formData.billingTaxId}
                onChange={(e) => setFormData({ ...formData, billingTaxId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: 12345678-9"
              />
            </div>
          </div>
        </div>

        {/* Datos de contacto administrativo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Datos de Contacto Administrativo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={formData.adminContactName}
                onChange={(e) => setFormData({ ...formData, adminContactName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="text"
                value={formData.adminContactPhone}
                onChange={(e) => setFormData({ ...formData, adminContactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: 0981 123 456"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
              <input
                type="email"
                value={formData.adminContactEmail}
                onChange={(e) => setFormData({ ...formData, adminContactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: admin@motel.com"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/financiero"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Historial de pagos */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
            <p className="text-sm text-gray-600">
              Registros de cobros realizados al motel
            </p>
          </div>
        </div>

        <form onSubmit={handleAddPayment} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
              <input
                type="number"
                min="1"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: 250000"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
              <input
                type="text"
                value={paymentForm.currency}
                onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="PYG"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                value={paymentForm.paidAt}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={paymentForm.status}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    status: e.target.value as PaymentStatus,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="PAID">Pagado</option>
                <option value="PENDING">Pendiente</option>
                <option value="FAILED">Fallido</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="DIRECT_DEBIT">Débito automático</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="EXCHANGE">Canje</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={addingPayment}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingPayment ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: Transferencia #123"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <input
                type="text"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Observaciones opcionales"
              />
            </div>
          </div>
        </form>

        {paymentHistory.length === 0 ? (
          <div className="text-sm text-gray-500">Sin pagos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Referencia</th>
                  <th className="py-2">Notas</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{formatDate(payment.paidAt)}</td>
                    <td className="py-3 pr-4">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          PAYMENT_STATUS_STYLES[payment.status]
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {payment.paymentType
                        ? PAYMENT_TYPE_LABELS[payment.paymentType]
                        : '-'}
                    </td>
                    <td className="py-3 pr-4">{payment.reference || '-'}</td>
                    <td className="py-3">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
