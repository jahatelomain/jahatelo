'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import DirtyBanner from '@/components/admin/DirtyBanner';
import { Building2, CreditCard, ContactRound, ReceiptText } from 'lucide-react';

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
  plan: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND';
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

const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DISABLED: 'Inhabilitado',
};

const FINANCIAL_STATUS_STYLES: Record<FinancialStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
  DISABLED: 'bg-red-100 text-red-700',
};

function FinanceSectionTitle({ icon: Icon, title, description }: { icon: typeof CreditCard; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-purple-50 p-2.5 text-purple-700"><Icon size={20} /></div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function EditFinancieroPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [motel, setMotel] = useState<Motel | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const formSnapshotRef = useRef('');

  const [formData, setFormData] = useState({
    billingDay: '',
    paymentType: '',
    financialStatus: 'ACTIVE' as FinancialStatus,
    plan: 'BASIC',
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
    if (!params?.id) return;
    const init = async () => {
      const targetId = await checkAccess(params.id as string);
      if (targetId) {
        fetchMotel(targetId);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const checkAccess = async (id: string) => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (!data.user) {
        router.push('/admin');
        return null;
      }

      const user = data.user as CurrentUser;
      if (user.role === 'MOTEL_ADMIN') {
        if (!user.motelId) {
          router.push('/admin');
          return null;
        }
        setReadOnly(true);
        if (user.motelId !== id) {
          router.replace(`/admin/financiero/${user.motelId}`);
        }
        return user.motelId;
      }

      if (user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return null;
      }

      setReadOnly(false);
      return id;
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
      return null;
    }
  };

  const fetchMotel = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/financiero/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMotel(data);
        setPaymentHistory(data.paymentHistory || []);
        const nextForm = {
          billingDay: data.billingDay?.toString() || '',
          paymentType: data.paymentType || '',
          financialStatus: data.financialStatus || 'ACTIVE',
          plan: data.plan || 'BASIC',
          billingCompanyName: data.billingCompanyName || '',
          billingTaxId: data.billingTaxId || '',
          adminContactName: data.adminContactName || '',
          adminContactEmail: data.adminContactEmail || '',
          adminContactPhone: data.adminContactPhone || '',
        };
        setFormData(nextForm);
        formSnapshotRef.current = JSON.stringify(nextForm);
        setFormDirty(false);
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
    if (readOnly) {
      toast?.showToast('Solo visualización para moteles', 'error');
      return;
    }
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
    if (readOnly) {
      toast?.showToast('Solo visualización para moteles', 'error');
      return;
    }
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
          plan: formData.plan,
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

  useEffect(() => {
    const snapshot = formSnapshotRef.current;
    if (!snapshot) return;
    setFormDirty(JSON.stringify(formData) !== snapshot);
  }, [formData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!motel) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-500">Motel no encontrado</div>
      </div>
    );
  }

  if (readOnly) {
    const details = [
      { label: 'Plan contratado', value: motel.plan },
      { label: 'Estado financiero', value: FINANCIAL_STATUS_LABELS[motel.financialStatus], badge: FINANCIAL_STATUS_STYLES[motel.financialStatus] },
      { label: 'Día de cobro', value: motel.billingDay ? `Día ${motel.billingDay}` : 'No informado' },
      { label: 'Tipo de cobro', value: motel.paymentType ? PAYMENT_TYPE_LABELS[motel.paymentType] : 'No informado' },
      { label: 'Razón social', value: motel.billingCompanyName || 'No informada' },
      { label: 'RUC', value: motel.billingTaxId || 'No informado' },
      { label: 'Contacto administrativo', value: motel.adminContactName || 'No informado' },
      { label: 'Correo de contacto', value: motel.adminContactEmail || 'No informado' },
      { label: 'Teléfono de contacto', value: motel.adminContactPhone || 'No informado' },
    ];

    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-600 px-6 py-7 text-white shadow-lg shadow-purple-200">
          <p className="text-sm font-medium text-purple-100">Cuenta de motel</p>
          <h1 className="mt-1 text-2xl font-semibold">{motel.name}</h1>
          <p className="mt-2 text-sm text-purple-100">Información comercial y estado de facturación.</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Resumen financiero</h2>
            <p className="mt-1 text-sm text-slate-600">Estos datos son informativos. Para solicitar un cambio, contactá al equipo de Jahatelo.</p>
          </div>

          <dl className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0 bg-white px-6 py-5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detail.label}</dt>
                <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                  {detail.badge ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${detail.badge}`}>{detail.value}</span> : detail.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-slate-100 px-6 py-6">
            <div className="flex items-center gap-2"><ReceiptText size={18} className="text-purple-600" /><h3 className="font-semibold text-slate-900">Historial de pagos</h3></div>
            {paymentHistory.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sin pagos registrados.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4">Fecha</th><th className="py-2 pr-4">Monto</th><th className="py-2 pr-4">Estado</th><th className="py-2 pr-4">Tipo</th><th className="py-2">Referencia</th></tr></thead>
                  <tbody className="text-slate-700">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4">{formatDate(payment.paidAt)}</td><td className="py-3 pr-4">{formatAmount(payment.amount, payment.currency)}</td><td className="py-3 pr-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[payment.status]}`}>{PAYMENT_STATUS_LABELS[payment.status]}</span></td><td className="py-3 pr-4">{payment.paymentType ? PAYMENT_TYPE_LABELS[payment.paymentType] : '-'}</td><td className="py-3">{payment.reference || '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        {!readOnly && (
          <Link
            href="/admin/financiero"
            className="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block"
          >
            ← Volver a Financiero
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{motel.name}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {readOnly ? 'Vista financiera (solo lectura)' : 'Editar datos financieros y de contacto'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {!readOnly && <DirtyBanner visible={formDirty} />}
        {/* Datos de cobro */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <FinanceSectionTitle icon={CreditCard} title="Datos de cobro" description="Configurá el ciclo, modalidad y condición comercial del motel." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Día de cobro (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.billingDay}
                onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de cobro
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
              >
                <option value="">Seleccionar...</option>
                <option value="DIRECT_DEBIT">Débito automático</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="EXCHANGE">Canje</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="GOLD">GOLD</option>
                <option value="DIAMOND">DIAMOND</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status financiero
              </label>
              <select
                value={formData.financialStatus}
                onChange={(e) =>
                  setFormData({ ...formData, financialStatus: e.target.value as FinancialStatus })
                }
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="DISABLED">Inhabilitado</option>
              </select>
            </div>

          </div>
        </div>

        {/* Datos de facturación */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <FinanceSectionTitle icon={Building2} title="Datos de facturación" description="Identificación fiscal utilizada para facturar al motel." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.billingCompanyName}
                onChange={(e) => setFormData({ ...formData, billingCompanyName: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: Empresa S.A."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nro. de RUC
              </label>
              <input
                type="text"
                value={formData.billingTaxId}
                onChange={(e) => setFormData({ ...formData, billingTaxId: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: 12345678-9"
              />
            </div>
          </div>
        </div>

        {/* Datos de contacto administrativo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <FinanceSectionTitle icon={ContactRound} title="Contacto administrativo" description="Persona y medios para consultas sobre la cuenta." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
              <input
                type="text"
                value={formData.adminContactName}
                onChange={(e) => setFormData({ ...formData, adminContactName: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
              <input
                type="text"
                value={formData.adminContactPhone}
                onChange={(e) => setFormData({ ...formData, adminContactPhone: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: 0981 123 456"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Correo</label>
              <input
                type="email"
                value={formData.adminContactEmail}
                onChange={(e) => setFormData({ ...formData, adminContactEmail: e.target.value })}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                placeholder="Ej: admin@motel.com"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 px-4 -mx-4 sm:-mx-6 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link
              href="/admin/financiero"
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-200"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>

      {/* Historial de pagos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2"><div className="rounded-xl bg-purple-50 p-2 text-purple-700"><ReceiptText size={18} /></div><h2 className="text-lg font-semibold text-slate-900">Historial de pagos</h2></div>
            <p className="text-sm text-slate-600">
              Registros de cobros realizados al motel
            </p>
          </div>
        </div>

        {!readOnly && (
          <form onSubmit={handleAddPayment} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Monto</label>
                <input
                  type="number"
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Ej: 250000"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Moneda</label>
                <input
                  type="text"
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="PYG"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <select
                  value={paymentForm.status}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      status: e.target.value as PaymentStatus,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="PAID">Pagado</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="FAILED">Fallido</option>
                  <option value="REFUNDED">Reembolsado</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <select
                  value={paymentForm.paymentType}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Referencia</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, reference: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Ej: Transferencia #123"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Observaciones opcionales"
                />
              </div>
            </div>
          </form>
        )}

        {paymentHistory.length === 0 ? (
          <div className="text-sm text-slate-500">Sin pagos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Referencia</th>
                  <th className="py-2">Notas</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
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
