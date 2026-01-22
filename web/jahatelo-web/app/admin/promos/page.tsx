'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DirtyBanner from '@/components/admin/DirtyBanner';
import PaginationControls from '../components/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';

type Motel = {
  id: string;
  name: string;
  city: string;
  plan?: string | null;
};

type Promo = {
  id: string;
  motel: Motel;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
};

export default function PromosAdminPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'GLOBAL' | 'SPECIFIC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const formSnapshotRef = useRef('');
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{
    activeCounts: Record<string, number>;
    typeCounts: Record<string, number>;
  }>({ activeCounts: {}, typeCounts: {} });
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const toast = useToast();

  const normalizePlan = (plan?: string | null) => (plan || 'BASIC').toUpperCase();
  const getPlanLabel = (plan?: string | null) => {
    const normalized = normalizePlan(plan);
    if (normalized === 'GOLD') return 'Gold';
    if (normalized === 'DIAMOND') return 'Diamond';
    if (normalized === 'FREE') return 'Free';
    return 'Básico';
  };
  const getPromoLimit = (plan?: string | null) => {
    const normalized = normalizePlan(plan);
    if (normalized === 'GOLD') return 5;
    if (normalized === 'DIAMOND') return Number.POSITIVE_INFINITY;
    return 1;
  };
  const formatLimit = (limit: number) => (Number.isFinite(limit) ? `${limit}` : 'Ilimitadas');

  const [formData, setFormData] = useState({
    motelId: '',
    title: '',
    description: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    isGlobal: false,
  });

  useEffect(() => {
    fetchMotels();
  }, []);

  const fetchPromos = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterType !== 'ALL') params.set('type', filterType);
      if (debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
      const res = await fetch(`/api/admin/promos?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar promos');
      const data = await res.json();
      const promosData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.promos)
        ? data.promos
        : [];
      const meta = Array.isArray(data) ? undefined : data?.meta;
      setPromos(promosData);
      setTotalItems(meta?.total ?? promosData.length);
      setSummary({
        activeCounts: meta?.summary?.activeCounts ?? {},
        typeCounts: meta?.summary?.typeCounts ?? {},
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const fetchMotels = async () => {
    try {
      const res = await fetch('/api/admin/motels');
      if (!res.ok) throw new Error('Error al cargar moteles');
      const data = await res.json();
      const motelsList = Array.isArray(data) ? data : Array.isArray(data?.motels) ? data.motels : [];
      setMotels(motelsList);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motelId || !formData.title) {
      toast.warning('Motel y título son requeridos');
      return;
    }

    try {
      const url = editingId ? `/api/admin/promos/${editingId}` : '/api/admin/promos';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast.success(editingId ? 'Promoción actualizada' : 'Promoción creada');
      fetchPromos();
      handleCancel();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar promoción');
    }
  };

  const handleEdit = (promo: Promo) => {
    const nextForm = {
      motelId: promo.motel.id,
      title: promo.title,
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : '',
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : '',
      isActive: promo.isActive,
      isGlobal: promo.isGlobal,
    };
    setEditingId(promo.id);
    setFormData(nextForm);
    setShowForm(true);
    formSnapshotRef.current = JSON.stringify(nextForm);
    setFormDirty(false);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmAction({
      title: 'Eliminar promoción',
      message: '¿Estás seguro de eliminar esta promoción? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Error al eliminar');
          toast.success('Promoción eliminada');
          fetchPromos();
        } catch (error: any) {
          toast.error(error.message || 'Error al eliminar promoción');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleToggleActive = async (promo: Promo) => {
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });

      if (!res.ok) throw new Error('Error al actualizar');
      toast.success(`Promoción ${!promo.isActive ? 'activada' : 'desactivada'}`);
      fetchPromos();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    const nextForm = {
      motelId: '',
      title: '',
      description: '',
      imageUrl: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      isGlobal: false,
    };
    setFormData(nextForm);
    formSnapshotRef.current = JSON.stringify(nextForm);
    setFormDirty(false);
  };

  const handleNew = () => {
    setEditingId(null);
    const nextForm = {
      motelId: '',
      title: '',
      description: '',
      imageUrl: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      isGlobal: false,
    };
    setFormData(nextForm);
    setShowForm(true);
    formSnapshotRef.current = JSON.stringify(nextForm);
    setFormDirty(false);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (!showForm) return;
    const snapshot = formSnapshotRef.current;
    if (!snapshot) return;
    setFormDirty(JSON.stringify(formData) !== snapshot);
  }, [formData, showForm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'promos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir imagen');

      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const selectedMotel = motels.find((motel) => motel.id === formData.motelId);
  const selectedPlan = selectedMotel?.plan ?? null;
  const selectedPromoLimit = getPromoLimit(selectedPlan);

  useEffect(() => {
    const nextKey = `${filterStatus}|${filterType}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterType, debouncedSearchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-40" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-72" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-24 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Promociones</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona las promociones de los moteles (solo SUPERADMIN)
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Promoción
          </button>
        )}
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por título o motel..."
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
            </div>
          </div>

          {/* Filtro Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>

          {/* Filtro Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="GLOBAL">Globales</option>
            <option value="SPECIFIC">Específicas</option>
          </select>
        </div>

        {/* Contadores */}
        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <span className="text-slate-600">
            Total: <span className="font-semibold text-slate-900">{totalItems}</span>
          </span>
          <span className="text-green-600">
            Activas: <span className="font-semibold">{summary.activeCounts.active ?? 0}</span>
          </span>
          <span className="text-purple-600">
            Globales: <span className="font-semibold">{summary.typeCounts.global ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <DirtyBanner visible={formDirty} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Motel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motel *
                </label>
                <select
                  value={formData.motelId}
                  onChange={(e) => setFormData({ ...formData, motelId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                  disabled={editingId !== null}
                >
                  <option value="">Seleccionar motel</option>
                  {motels.map((motel) => (
                    <option key={motel.id} value={motel.id}>
                      {motel.name} - {motel.city}
                    </option>
                  ))}
                </select>
                {editingId && (
                  <p className="text-xs text-slate-500 mt-1">No se puede cambiar el motel al editar</p>
                )}
                {formData.motelId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Límite por plan ({getPlanLabel(selectedPlan)}): Básico 1 activa · Gold 5 activas · Diamond ilimitadas.
                    <span className="ml-2">Límite actual: {formatLimit(selectedPromoLimit)}.</span>
                    {!selectedMotel?.plan && (
                      <span className="ml-2">Plan no disponible en listado; se validará al guardar.</span>
                    )}
                  </p>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Ej: 2x1 en habitaciones"
                  required
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción <span className="text-slate-400">(opcional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Detalles de la promoción..."
                rows={3}
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Imagen <span className="text-slate-400">(opcional)</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="promo-image"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="promo-image"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Subir imagen
                    </>
                  )}
                </label>
                {formData.imageUrl && (
                  <div className="relative w-20 h-20">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Válida desde <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Válida hasta <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-600"
                />
                <span className="text-sm font-medium text-slate-700">Activa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  Global (mostrar en todos lados)
                </span>
              </label>
            </div>

            {/* Botones */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 pb-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
              >
                {editingId ? 'Actualizar' : 'Crear'} Promoción
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Promoción
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Motel
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl text-slate-300">🎁</span>
                      <p className="text-slate-500 font-medium">
                        {searchQuery || filterStatus !== 'ALL' || filterType !== 'ALL'
                          ? 'No se encontraron promociones con estos filtros'
                          : 'No hay promociones registradas'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {!showForm && 'Creá la primera usando el botón de arriba'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promo.imageUrl && (
                          <img
                            src={promo.imageUrl}
                            alt={promo.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{promo.title}</p>
                          {promo.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">{promo.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-900">{promo.motel.name}</p>
                      <p className="text-xs text-slate-500">{promo.motel.city}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {promo.validFrom || promo.validUntil ? (
                        <div className="text-xs space-y-0.5">
                          {promo.validFrom && (
                            <p>
                              Desde: {new Date(promo.validFrom).toLocaleDateString('es-AR')}
                            </p>
                          )}
                          {promo.validUntil && (
                            <p>
                              Hasta: {new Date(promo.validUntil).toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin límite</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            promo.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {promo.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                        {promo.isGlobal && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                            Global
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                        >
                          Editar
                        </button>
                        <details className="relative">
                          <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                          </summary>
                          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                            <button
                              onClick={() => handleToggleActive(promo)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {promo.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </details>
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
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText}
        cancelText={confirmAction?.cancelText}
        danger={confirmAction?.danger}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </div>
  );
}
