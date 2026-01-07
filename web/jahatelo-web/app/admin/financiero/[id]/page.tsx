'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

type PaymentType = 'DIRECT_DEBIT' | 'TRANSFER' | 'EXCHANGE';
type FinancialStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

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
}

export default function EditFinancieroPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [motel, setMotel] = useState<Motel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
