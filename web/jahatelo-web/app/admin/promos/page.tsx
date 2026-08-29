'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DirtyBanner from '@/components/admin/DirtyBanner';
import { useDebounce } from '@/hooks/useDebounce';
import { usePersistentAdminFilters } from '@/hooks/usePersistentAdminFilters';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { BadgeCheck, Pencil, Power, Ticket, Trash2 } from 'lucide-react';
import SearchableSelect from '@/components/admin/SearchableSelect';
import AdminImage from '@/components/admin/motel-detail/AdminImage';
import { getErrorMessage } from '@/lib/errors';
import { exceedsImageUploadLimit, imageUploadLimitMessage } from '@/lib/media/uploadLimits';

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
  hasPromoCode: boolean;
  codeRepeatRule: string | null;
  codeLimit: number | null;
  codeLimitPeriod: string | null;
  createdAt: string;
};

type PromoCode = {
  id: string;
  code: string;
  status: 'PENDING' | 'USED';
  deviceId: string;
  createdAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
};

type PromoCodeSummary = {
  total: number;
  pending: number;
  used: number;
};

type CurrentUser = {
  id: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
};

type PromoPayload = {
  motelId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isGlobal: boolean;
  hasPromoCode: boolean;
  codeRepeatRule: string | null;
  codeLimit: number | null;
  codeLimitPeriod: string | null;
};

export default function PromosAdminPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [filterStatus, setFilterStatus] = usePersistentAdminFilters<'ALL' | 'ACTIVE' | 'INACTIVE'>('promos-status', 'ALL');
  const [filterType, setFilterType] = usePersistentAdminFilters<'ALL' | 'GLOBAL' | 'SPECIFIC'>('promos-type', 'ALL');
  const [searchQuery, setSearchQuery] = usePersistentAdminFilters('promos-search', '');
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
  const hasMore = promos.length < totalItems;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Codes panel state
  const [expandedCodesPromoId, setExpandedCodesPromoId] = useState<string | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [codesSummary, setCodesSummary] = useState<PromoCodeSummary | null>(null);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codesPage, setCodesPage] = useState(1);
  const [codesTotalPages, setCodesTotalPages] = useState(1);

  // Redeem state
  const [redeemPromoId, setRedeemPromoId] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    valid: boolean;
    confirmed?: boolean;
    reason?: string;
    promoTitle?: string;
    promoDescription?: string | null;
    redeemedAt?: string;
  } | null>(null);

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
    if (normalized === 'GOLD') return 3;
    if (normalized === 'DIAMOND') return Number.POSITIVE_INFINITY;
    return 1;
  };
  const formatLimit = (limit: number) => (Number.isFinite(limit) ? `${limit}` : 'Ilimitadas');

  const getRepeatRuleLabel = (rule: string | null) => {
    switch (rule) {
      case 'DAILY': return 'Diario';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensual';
      case 'NEVER': return 'Una vez';
      default: return '—';
    }
  };

  const getLimitPeriodLabel = (period: string | null) => {
    switch (period) {
      case 'WEEKLY': return 'por semana';
      case 'MONTHLY': return 'por mes';
      case 'UNLIMITED': return 'total';
      default: return '';
    }
  };

  const [formData, setFormData] = useState({
    motelId: '',
    title: '',
    description: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    isGlobal: false,
    hasPromoCode: false,
    codeRepeatRule: '',
    codeLimit: '',
    codeLimitPeriod: '',
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
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

    void checkAccess();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    fetchMotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchPromos = async (isLoadingMore = false) => {
    if (!currentUser) return;
    if (isLoadingMore) {
      setLoadingMore(true);
    }

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
      setPromos((prev) => (isLoadingMore ? [...prev, ...promosData] : promosData));
      setTotalItems(meta?.total ?? promosData.length);
      setSummary({
        activeCounts: meta?.summary?.activeCounts ?? {},
        typeCounts: meta?.summary?.typeCounts ?? {},
      });
    } catch (error) {
      console.error('Error:', error);
      if (!isLoadingMore) {
        toast.error('Error al cargar promociones');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMotels = async () => {
    if (!currentUser || currentUser.role !== 'SUPERADMIN') return;
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

  const fetchCodes = async (promoId: string, pg = 1) => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`/api/admin/promos/${promoId}/codes?page=${pg}&limit=20`);
      if (!res.ok) throw new Error('Error al cargar códigos');
      const data = await res.json();
      setCodes(pg === 1 ? data.data : (prev) => [...prev, ...data.data]);
      setCodesSummary(data.summary);
      setCodesTotalPages(data.meta?.totalPages ?? 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar códigos');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleToggleCodes = (promoId: string) => {
    if (expandedCodesPromoId === promoId) {
      setExpandedCodesPromoId(null);
      setCodes([]);
      setCodesSummary(null);
      setCodesPage(1);
    } else {
      setExpandedCodesPromoId(promoId);
      setCodes([]);
      setCodesPage(1);
      fetchCodes(promoId, 1);
    }
  };

  const handleLoadMoreCodes = () => {
    if (!expandedCodesPromoId) return;
    const next = codesPage + 1;
    setCodesPage(next);
    fetchCodes(expandedCodesPromoId, next);
  };

  // Redeem handlers
  const handleOpenRedeem = (promoId: string) => {
    setRedeemPromoId(promoId);
    setRedeemCode('');
    setRedeemResult(null);
  };

  const handleCloseRedeem = () => {
    setRedeemPromoId(null);
    setRedeemCode('');
    setRedeemResult(null);
    setRedeemLoading(false);
  };

  const handleValidateCode = async () => {
    if (!redeemPromoId || !redeemCode.trim()) return;
    setRedeemLoading(true);
    setRedeemResult(null);
    try {
      const res = await fetch(`/api/admin/promos/${redeemPromoId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase(), confirm: false }),
      });
      const data = await res.json();
      setRedeemResult(data);
    } catch {
      toast.error('Error al validar código');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!redeemPromoId || !redeemCode.trim()) return;
    setRedeemLoading(true);
    try {
      const res = await fetch(`/api/admin/promos/${redeemPromoId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase(), confirm: true }),
      });
      const data = await res.json();
      if (data.confirmed) {
        toast.success('Código canjeado correctamente');
        handleCloseRedeem();
        // Refresh codes panel if open
        if (expandedCodesPromoId === redeemPromoId) {
          setCodes([]);
          setCodesPage(1);
          fetchCodes(redeemPromoId, 1);
        }
      } else {
        setRedeemResult(data);
      }
    } catch {
      toast.error('Error al canjear código');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motelId || !formData.title) {
      toast.warning('Motel y título son requeridos');
      return;
    }

    if (formData.hasPromoCode && !formData.codeRepeatRule) {
      toast.warning('Seleccioná la regla de repetición del código');
      return;
    }

    try {
      const url = editingId ? `/api/admin/promos/${editingId}` : '/api/admin/promos';
      const method = editingId ? 'PATCH' : 'POST';

      const payload: PromoPayload = {
        motelId: formData.motelId,
        title: formData.title,
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        isActive: formData.isActive,
        isGlobal: formData.isGlobal,
        hasPromoCode: formData.hasPromoCode,
        codeRepeatRule: null,
        codeLimit: null,
        codeLimitPeriod: null,
      };

      if (formData.hasPromoCode) {
        payload.codeRepeatRule = formData.codeRepeatRule || null;
        payload.codeLimit = formData.codeLimit ? Number(formData.codeLimit) : null;
        payload.codeLimitPeriod = formData.codeLimitPeriod || null;
      } else {
        payload.codeRepeatRule = null;
        payload.codeLimit = null;
        payload.codeLimitPeriod = null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }

      toast.success(editingId ? 'Promoción actualizada' : 'Promoción creada');
      fetchPromos();
      handleCancel();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Error al guardar promoción'));
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
      hasPromoCode: promo.hasPromoCode,
      codeRepeatRule: promo.codeRepeatRule || '',
      codeLimit: promo.codeLimit !== null && promo.codeLimit !== undefined ? String(promo.codeLimit) : '',
      codeLimitPeriod: promo.codeLimitPeriod || '',
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
        if (deletingIds.has(id)) return;
        setDeletingIds((current) => new Set(current).add(id));
        try {
          const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.error || 'Error al eliminar');
          setPromos((current) => current.filter((promo) => promo.id !== id));
          toast.success('Promoción eliminada');
          if (expandedCodesPromoId === id) {
            setExpandedCodesPromoId(null);
            setCodes([]);
          }
          void fetchPromos();
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, 'Error al eliminar promoción'));
        } finally {
          setDeletingIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Error al actualizar estado'));
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
      hasPromoCode: false,
      codeRepeatRule: '',
      codeLimit: '',
      codeLimitPeriod: '',
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
      hasPromoCode: false,
      codeRepeatRule: '',
      codeLimit: '',
      codeLimitPeriod: '',
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

    if (exceedsImageUploadLimit(file)) {
      toast.warning(imageUploadLimitMessage);
      return;
    }

    setUploadingImage(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'promos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!res.ok) throw new Error('Error al subir imagen');

      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Error al subir imagen'));
    } finally {
      setUploadingImage(false);
    }
  };

  const selectedMotel = motels.find((motel) => motel.id === formData.motelId);
  const selectedPlan = selectedMotel?.plan ?? null;
  const selectedPromoLimit = getPromoLimit(selectedPlan);

  useEffect(() => {
    if (!currentUser) return;
    const nextKey = `${filterStatus}|${filterType}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const isLoadingMore = page > 1;
    fetchPromos(isLoadingMore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterType, debouncedSearchQuery, currentUser]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

  const getRedeemReasonLabel = (reason?: string) => {
    switch (reason) {
      case 'INVALID_CODE': return 'Código inválido o no existe';
      case 'WRONG_PROMO': return 'El código no pertenece a esta promoción';
      case 'ALREADY_USED': return 'El código ya fue canjeado';
      case 'PROMO_INACTIVE': return 'La promoción está inactiva o vencida';
      default: return reason ?? 'Error desconocido';
    }
  };

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
        <TableSkeleton rows={6} columns={6} />
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
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por título o motel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="GLOBAL">Globales</option>
            <option value="SPECIFIC">Específicas</option>
          </select>
        </div>
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
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Motel *</label>
                <SearchableSelect
                  value={formData.motelId}
                  onChange={(motelId) => setFormData({ ...formData, motelId })}
                  options={motels.map((motel) => ({ value: motel.id, label: `${motel.name} - ${motel.city}`, searchText: `${motel.name} ${motel.city}` }))}
                  placeholder="Escribí para buscar un motel"
                  required
                  disabled={editingId !== null}
                />
                {editingId && (
                  <p className="text-xs text-slate-500 mt-1">No se puede cambiar el motel al editar</p>
                )}
                {formData.motelId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Plan {getPlanLabel(selectedPlan)}: límite {formatLimit(selectedPromoLimit)} promos activas.
                    {!selectedMotel?.plan && ' Plan no disponible; se validará al guardar.'}
                  </p>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Subir imagen
                    </>
                  )}
                </label>
                {formData.imageUrl && (
                  <div className="relative w-20 h-20">
                    <AdminImage src={formData.imageUrl} alt="Preview" width={80} height={80} className="w-full h-full object-cover rounded-lg border border-slate-200" />
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

            {/* Checkboxes básicos */}
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
                <span className="text-sm font-medium text-slate-700">Global (mostrar en todos lados)</span>
              </label>
            </div>

            {/* ── Sección Cupones de Código ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasPromoCode}
                  onChange={(e) => setFormData({ ...formData, hasPromoCode: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-600"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">Habilitar cupones de código</span>
                  <p className="text-xs text-slate-500 mt-0.5">Los usuarios podrán obtener un código único para canjear en recepción</p>
                </div>
              </label>

              {formData.hasPromoCode && (
                <div className="space-y-4 pl-7">
                  {/* Regla de repetición */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ¿Con qué frecuencia puede un usuario reclamar? *
                    </label>
                    <select
                      value={formData.codeRepeatRule}
                      onChange={(e) => setFormData({ ...formData, codeRepeatRule: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required={formData.hasPromoCode}
                    >
                      <option value="">Seleccionar regla</option>
                      <option value="NEVER">Una sola vez (nunca puede repetir)</option>
                      <option value="DAILY">Una vez por día</option>
                      <option value="WEEKLY">Una vez por semana</option>
                      <option value="MONTHLY">Una vez por mes</option>
                    </select>
                  </div>

                  {/* Límite global */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Límite total de cupones <span className="text-slate-400">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.codeLimit}
                        onChange={(e) => setFormData({ ...formData, codeLimit: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Ej: 100"
                      />
                      <p className="text-xs text-slate-500 mt-1">Dejar vacío para cupones ilimitados</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Período del límite
                      </label>
                      <select
                        value={formData.codeLimitPeriod}
                        onChange={(e) => setFormData({ ...formData, codeLimitPeriod: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        disabled={!formData.codeLimit}
                      >
                        <option value="">Sin período (total acumulado)</option>
                        <option value="WEEKLY">Por semana</option>
                        <option value="MONTHLY">Por mes</option>
                        <option value="UNLIMITED">Total sin reinicio</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <strong>Ejemplo:</strong> Regla &quot;Una vez por semana&quot; + límite &quot;50 por mes&quot; significa que cada usuario puede reclamar un código por semana, y la promo acepta máximo 50 cupones por mes en total.
                    </p>
                  </div>
                </div>
              )}
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

      {/* Modal de canje */}
      {redeemPromoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Canjear cupón</h3>
              <button onClick={handleCloseRedeem} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Código del cupón</label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => {
                  setRedeemCode(e.target.value.toUpperCase());
                  setRedeemResult(null);
                }}
                maxLength={6}
                placeholder="Ej: A3KP2X"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 font-mono text-lg tracking-widest text-center focus:ring-2 focus:ring-purple-600 focus:border-transparent uppercase"
              />
            </div>

            {/* Resultado de validación */}
            {redeemResult && (
              <div className={`rounded-lg p-4 ${redeemResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {redeemResult.valid ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-green-800">Código válido</p>
                    <p className="text-sm text-green-700">{redeemResult.promoTitle}</p>
                    {redeemResult.promoDescription && (
                      <p className="text-xs text-green-600">{redeemResult.promoDescription}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-red-800">{getRedeemReasonLabel(redeemResult.reason)}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {(!redeemResult || !redeemResult.valid) && (
                <button
                  onClick={handleValidateCode}
                  disabled={redeemLoading || redeemCode.length !== 6}
                  className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors disabled:opacity-50"
                >
                  {redeemLoading ? 'Validando...' : 'Validar código'}
                </button>
              )}
              {redeemResult?.valid && (
                <button
                  onClick={handleConfirmRedeem}
                  disabled={redeemLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                >
                  {redeemLoading ? 'Canjeando...' : 'Confirmar canje'}
                </button>
              )}
              <button
                onClick={handleCloseRedeem}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Promoción</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Motel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vigencia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cupones</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                  <>
                    <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {promo.imageUrl && (
                            <AdminImage src={promo.imageUrl} alt={promo.title} width={48} height={48} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
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
                            {promo.validFrom && <p>Desde: {new Date(promo.validFrom).toLocaleDateString('es-AR')}</p>}
                            {promo.validUntil && <p>Hasta: {new Date(promo.validUntil).toLocaleDateString('es-AR')}</p>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin límite</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {promo.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {promo.isGlobal && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                              Global
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {promo.hasPromoCode ? (
                          <div className="space-y-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                              Con cupones
                            </span>
                            <p className="text-xs text-slate-500">{getRepeatRuleLabel(promo.codeRepeatRule)}</p>
                            {promo.codeLimit && (
                              <p className="text-xs text-slate-400">Límite: {promo.codeLimit} {getLimitPeriodLabel(promo.codeLimitPeriod)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin cupones</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                            title="Editar promoción"
                            aria-label="Editar promoción"
                          >
                            <Pencil size={16} />
                          </button>
                          {promo.hasPromoCode && (
                            <button
                              onClick={() => handleToggleCodes(promo.id)}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                                expandedCodesPromoId === promo.id
                                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700'
                              }`}
                              title="Ver códigos"
                              aria-label="Ver códigos"
                            >
                              <Ticket size={16} />
                            </button>
                          )}
                          {promo.hasPromoCode && (
                            <button
                              onClick={() => handleOpenRedeem(promo.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-green-200 bg-white text-green-700 hover:bg-green-50 transition-colors"
                              title="Canjear código"
                              aria-label="Canjear código"
                            >
                              <BadgeCheck size={16} />
                            </button>
                          )}
                          <button onClick={() => handleToggleActive(promo)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700" title={promo.isActive ? 'Desactivar promoción' : 'Activar promoción'} aria-label={promo.isActive ? 'Desactivar promoción' : 'Activar promoción'}>
                            <Power size={16} />
                          </button>
                          <button disabled={deletingIds.has(promo.id)} onClick={() => handleDelete(promo.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40" title="Eliminar promoción" aria-label="Eliminar promoción">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Panel de códigos expandible */}
                    {expandedCodesPromoId === promo.id && (
                      <tr key={`${promo.id}-codes`}>
                        <td colSpan={6} className="px-6 pb-4 bg-amber-50">
                          <div className="border border-amber-200 rounded-xl overflow-hidden mt-2">
                            {/* Header panel */}
                            <div className="bg-amber-100 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-amber-900">Cupones de {promo.title}</span>
                                {codesSummary && (
                                  <div className="flex gap-3 text-xs text-amber-800">
                                    <span>Total: <strong>{codesSummary.total}</strong></span>
                                    <span>Pendientes: <strong>{codesSummary.pending}</strong></span>
                                    <span>Usados: <strong>{codesSummary.used}</strong></span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleToggleCodes(promo.id)}
                                className="text-amber-700 hover:text-amber-900"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            {/* Tabla de códigos */}
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-amber-200">
                                <thead className="bg-amber-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Código</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Estado</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Dispositivo</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Reclamado</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase">Canjeado</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-amber-100">
                                  {loadingCodes && codes.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                                        Cargando códigos...
                                      </td>
                                    </tr>
                                  ) : codes.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                                        No hay cupones generados todavía
                                      </td>
                                    </tr>
                                  ) : (
                                    codes.map((c) => (
                                      <tr key={c.id} className="hover:bg-amber-50">
                                        <td className="px-4 py-2 font-mono font-bold text-sm text-slate-900 tracking-widest">{c.code}</td>
                                        <td className="px-4 py-2">
                                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${c.status === 'USED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {c.status === 'USED' ? 'Usado' : 'Pendiente'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-slate-500 font-mono">{c.deviceId}</td>
                                        <td className="px-4 py-2 text-xs text-slate-500">
                                          {new Date(c.createdAt).toLocaleDateString('es-AR')}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-slate-500">
                                          {c.redeemedAt ? new Date(c.redeemedAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Cargar más */}
                            {codesPage < codesTotalPages && (
                              <div className="px-4 py-3 bg-amber-50 text-center">
                                <button
                                  onClick={handleLoadMoreCodes}
                                  disabled={loadingCodes}
                                  className="text-sm text-amber-700 font-medium hover:text-amber-900 disabled:opacity-50"
                                >
                                  {loadingCodes ? 'Cargando...' : 'Cargar más'}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {promos.length > 0 && (
          <div ref={sentinelRef} className="px-6 pb-6">
            {loadingMore && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Cargando más promociones...</span>
              </div>
            )}
            {!hasMore && totalItems > pageSize && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">
                  Mostrando todas las promociones ({promos.length} de {totalItems})
                </p>
              </div>
            )}
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
