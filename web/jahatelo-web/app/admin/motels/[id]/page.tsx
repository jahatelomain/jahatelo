'use client';

import { useCallback, useEffect, useMemo, useState, ChangeEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DirtyBanner from '@/components/admin/DirtyBanner';
import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';
import { exceedsImageUploadLimit, imageUploadLimitMessage } from '@/lib/media/uploadLimits';
import {
  extractLatLngFromMapUrl,
  getGoogleMapsExternalUrl,
  getResponseError,
  normalizeMapUrl,
  normalizeOptionalText,
  normalizeUploadUrl,
} from '@/components/admin/motel-detail/formUtils';
import type {
  Amenity,
  WeekdayRateForm,
  Motel,
  MotelAdminTab,
  MotelReview,
  MotelStatus,
  Promo,
  PromoCodeEntry,
  RedeemResult,
  RoomType,
} from '@/components/admin/motel-detail/types';
import {
  createInitialPromoForm,
  createInitialRoomForm,
} from '@/components/admin/motel-detail/formDefaults';
import { createCroppedImageFile } from '@/components/admin/motel-detail/imageProcessing';
import {
  formatLimit,
  getPlanLabel,
  getPlanPromoLimit,
  getPlanRoomPhotoLimit,
  sortByExplicitOrder,
} from '@/components/admin/motel-detail/displayUtils';
import MotelAdminTabs from '@/components/admin/motel-detail/MotelAdminTabs';
import ReviewsPanel from '@/components/admin/motel-detail/ReviewsPanel';
import MotelAdminHeader from '@/components/admin/motel-detail/MotelAdminHeader';
import MenuCategoryCard from '@/components/admin/motel-detail/MenuCategoryCard';
import MenuForms from '@/components/admin/motel-detail/MenuForms';
import MotelLocationFields from '@/components/admin/motel-detail/MotelLocationFields';
import CommercialContactFields from '@/components/admin/motel-detail/CommercialContactFields';
import CommercialPlanFields from '@/components/admin/motel-detail/CommercialPlanFields';
import RoomEditorForm from '@/components/admin/motel-detail/RoomEditorForm';
import useFormDirty from '@/hooks/useFormDirty';
import RoomList from '@/components/admin/motel-detail/RoomList';
import { MAX_STORED_ROOM_PHOTOS } from '@/lib/domain/motels/roomPhotoLimits';
import FeaturedPhotoFields from '@/components/admin/motel-detail/FeaturedPhotoFields';
import PromoEditorForm from '@/components/admin/motel-detail/PromoEditorForm';
import CommercialSummary from '@/components/admin/motel-detail/CommercialSummary';
import GeneralInfoSummary from '@/components/admin/motel-detail/GeneralInfoSummary';
import PromoCard from '@/components/admin/motel-detail/PromoCard';
import PromoCodePanel from '@/components/admin/motel-detail/PromoCodePanel';

export default function MotelDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = useMemo(() => {
    const value = params?.id;
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
  }, [params]);
  const router = useRouter();
  const [motel, setMotel] = useState<Motel | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MotelAdminTab>('details');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const [editingMotel, setEditingMotel] = useState(false);
  const [editingCommercial, setEditingCommercial] = useState(false);
  const [motelForm, setMotelForm] = useState({
    name: '',
    description: '',
    country: 'Paraguay',
    city: '',
    address: '',
    mapUrl: '',
    phone: '',
    whatsapp: '',
    website: '',
    instagram: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    adminContactName: '',
    adminContactEmail: '',
    adminContactPhone: '',
    operationsContactName: '',
    operationsContactEmail: '',
    operationsContactPhone: '',
    status: 'PENDING' as MotelStatus,
    isActive: false,
    plan: 'BASIC',
    nextBillingAt: '',
    isFeatured: false,
    featuredPhoto: '',
    featuredPhotoWeb: '',
    featuredPhotoApp: '',
  });

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState(createInitialRoomForm());
  const [weekdayRateRules, setWeekdayRateRules] = useState<WeekdayRateForm[]>([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ title: '', sortOrder: 0 });

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '' });

  // Promos state
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState(createInitialPromoForm());

  // PromoCode state
  const [promoCodesMap, setPromoCodesMap] = useState<Record<string, PromoCodeEntry[]>>({});
  const [promoCodesSummary, setPromoCodesSummary] = useState<Record<string, { total: number; pending: number; used: number }>>({});
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});
  const [redeemInput, setRedeemInput] = useState<Record<string, string>>({});
  const [redeemResult, setRedeemResult] = useState<Record<string, RedeemResult | null>>({});
  const [redeemLoading, setRedeemLoading] = useState<Record<string, boolean>>({});
  const [openPromoMenuId, setOpenPromoMenuId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingFeaturedWeb, setUploadingFeaturedWeb] = useState(false);
  const [uploadingFeaturedApp, setUploadingFeaturedApp] = useState(false);
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);
  const [uploadingPromo, setUploadingPromo] = useState(false);
  const [reviews, setReviews] = useState<MotelReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [roomOrderIds, setRoomOrderIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const roomFormRef = useRef<HTMLDivElement | null>(null);
  const promoFormDirty = useFormDirty(promoForm, showPromoForm);
  const motelFormDirty = useFormDirty(motelForm, editingMotel || editingCommercial);
  const roomFormDirty = useFormDirty(roomForm, showRoomForm);
  const categoryFormDirty = useFormDirty(categoryForm, showCategoryForm);
  const itemFormDirty = useFormDirty(itemForm, showItemForm);

  const fetchMotel = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch(`/api/admin/motels/${id}?fresh=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const next = encodeURIComponent(`/admin/motels/${id}`);
          router.replace(`/admin/login?next=${next}`);
          return;
        }
        setMotel(null);
        setFetchError(data?.error || 'No se pudo cargar el motel');
        return;
      }
      setMotel(data);
      setRoomOrderIds((data.rooms ?? []).map((room: RoomType) => room.id));
      setMotelForm({
        name: data.name,
        description: data.description || '',
        country: data.country || 'Paraguay',
        city: data.city || '',
        address: data.address || '',
        mapUrl: data.mapUrl || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        website: data.website || '',
        instagram: data.instagram || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        adminContactName: data.adminContactName || '',
        adminContactEmail: data.adminContactEmail || '',
        adminContactPhone: data.adminContactPhone || '',
        operationsContactName: data.operationsContactName || '',
        operationsContactEmail: data.operationsContactEmail || '',
        operationsContactPhone: data.operationsContactPhone || '',
        status: data.status,
        isActive: data.isActive,
        plan: data.plan || 'BASIC',
        nextBillingAt: data.nextBillingAt || '',
        isFeatured: data.isFeatured || false,
        featuredPhoto: normalizeUploadUrl(data.featuredPhoto || '') || '',
        featuredPhotoWeb: normalizeUploadUrl(data.featuredPhotoWeb || '') || '',
        featuredPhotoApp: normalizeUploadUrl(data.featuredPhotoApp || '') || '',
      });
    } catch (error) {
      console.error('Error fetching motel:', error);
      setFetchError('Error al obtener motel');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchAmenities = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/amenities');
      if (!res.ok) {
        setAmenities([]);
        console.error('Error fetching amenities:', res.status);
        return;
      }
      const data = await res.json();
      setAmenities(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenities([]);
    }
  }, []);

  const fetchPromos = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/promos?motelId=${id}`);
      const data = await res.json();
      setPromos(data);
    } catch (error) {
      console.error('Error fetching promos:', error);
    }
  }, [id]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUser(null);
    }
  }, []);

  const buildPromoPayload = (form: ReturnType<typeof createInitialPromoForm>) => ({
    ...form,
    hasPromoCode: form.hasPromoCode,
    codeRepeatRule: form.hasPromoCode ? (form.codeRepeatRule || null) : null,
    codeLimit: form.hasPromoCode && form.codeLimit !== '' ? Number(form.codeLimit) : null,
    codeLimitPeriod: form.hasPromoCode ? (form.codeLimitPeriod || null) : null,
  });

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromoId) {
        // Update existing promo
        const res = await fetch(`/api/admin/promos/${editingPromoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPromoPayload(promoForm)),
        });
        if (res.ok) {
          fetchPromos();
          setShowPromoForm(false);
          setEditingPromoId(null);
          setPromoForm(createInitialPromoForm());
        } else {
          const message = await getResponseError(res, 'Error al actualizar promo');
          toast.error(message);
        }
      } else {
        // Create new promo
        const res = await fetch('/api/admin/promos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...buildPromoPayload(promoForm), motelId: id }),
        });
        if (res.ok) {
          fetchPromos();
          setShowPromoForm(false);
          setPromoForm(createInitialPromoForm());
        } else {
          const message = await getResponseError(res, 'Error al crear promo');
          toast.error(message);
        }
      }
    } catch (error) {
      console.error('Error saving promo:', error);
      toast.error('Error al guardar promo');
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    setConfirmAction({
      title: 'Eliminar promo',
      message: '¿Estás seguro de eliminar esta promo? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/promos/${promoId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchPromos();
          } else {
            toast.error(await getResponseError(res, 'No se pudo eliminar la promo'));
          }
        } catch (error) {
          console.error('Error deleting promo:', error);
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleTogglePromoActive = async (promo: Promo) => {
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (!res.ok) throw new Error(await getResponseError(res, 'No se pudo actualizar la promo'));
      toast.success(promo.isActive ? 'Promo desactivada; su historial se conserva.' : 'Promo reactivada.');
      fetchPromos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la promo');
    }
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromoId(promo.id);
    setPromoForm({
      title: promo.title,
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      isGlobal: promo.isGlobal || false,
      hasPromoCode: promo.hasPromoCode || false,
      codeRepeatRule: promo.codeRepeatRule || 'NEVER',
      codeLimit: promo.codeLimit !== null && promo.codeLimit !== undefined ? String(promo.codeLimit) : '',
      codeLimitPeriod: promo.codeLimitPeriod || 'UNLIMITED',
    });
    setShowPromoForm(true);
  };

  const fetchPromoCodes = async (promoId: string) => {
    try {
      const res = await fetch(`/api/admin/promos/${promoId}/codes?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      setPromoCodesMap((prev) => ({ ...prev, [promoId]: data.data }));
      setPromoCodesSummary((prev) => ({ ...prev, [promoId]: data.summary }));
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const handleVerifyCode = async (promoId: string) => {
    const code = redeemInput[promoId]?.trim().toUpperCase();
    if (!code || code.length !== 6) return;
    setRedeemLoading((prev) => ({ ...prev, [promoId]: true }));
    setRedeemResult((prev) => ({ ...prev, [promoId]: null }));
    try {
      const res = await fetch(`/api/admin/promos/${promoId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, confirm: false }),
      });
      const data = await res.json();
      setRedeemResult((prev) => ({ ...prev, [promoId]: data }));
    } catch (error) {
      console.error('Error verifying code:', error);
    } finally {
      setRedeemLoading((prev) => ({ ...prev, [promoId]: false }));
    }
  };

  const handleConfirmRedeem = async (promoId: string) => {
    const code = redeemInput[promoId]?.trim().toUpperCase();
    if (!code) return;
    setRedeemLoading((prev) => ({ ...prev, [promoId]: true }));
    try {
      const res = await fetch(`/api/admin/promos/${promoId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, confirm: true }),
      });
      const data = await res.json();
      setRedeemResult((prev) => ({ ...prev, [promoId]: data }));
      if (data.valid && data.confirmed) {
        setRedeemInput((prev) => ({ ...prev, [promoId]: '' }));
        fetchPromoCodes(promoId);
      }
    } catch (error) {
      console.error('Error confirming redeem:', error);
    } finally {
      setRedeemLoading((prev) => ({ ...prev, [promoId]: false }));
    }
  };

  const handlePromoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPromo(true);
    try {
      const uploadedUrl = await uploadFileToS3(file);
      setPromoForm({ ...promoForm, imageUrl: uploadedUrl });
    } catch (error) {
      console.error('Error uploading promo image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingPromo(false);
    }
  };

  const handleUpdateMotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedMapUrl = normalizeMapUrl(motelForm.mapUrl || '');
      const extractedCoords = extractLatLngFromMapUrl(normalizedMapUrl);
      const fallbackFeaturedPhoto =
        normalizeOptionalText(motelForm.featuredPhoto || '') ||
        normalizeOptionalText(motelForm.featuredPhotoWeb || '') ||
        normalizeOptionalText(motelForm.featuredPhotoApp || '');
      const payload = {
        name: normalizeOptionalText(motelForm.name || ''),
        description: normalizeOptionalText(motelForm.description || ''),
        country: normalizeOptionalText(motelForm.country || ''),
        city: normalizeOptionalText(motelForm.city || ''),
        address: normalizeOptionalText(motelForm.address || ''),
        mapUrl: normalizedMapUrl,
        phone: normalizeOptionalText(motelForm.phone || ''),
        whatsapp: normalizeOptionalText(motelForm.whatsapp || ''),
        isFeatured: motelForm.isFeatured,
        featuredPhoto: normalizeUploadUrl(fallbackFeaturedPhoto),
        featuredPhotoWeb: normalizeUploadUrl(motelForm.featuredPhotoWeb || ''),
        featuredPhotoApp: normalizeUploadUrl(motelForm.featuredPhotoApp || ''),
        // Los enlaces de ficha de Google Maps conservan el pin exacto aunque no
        // expongan coordenadas. En ese caso no se interrumpe el guardado ni se
        // borran coordenadas existentes de registros anteriores.
        ...(extractedCoords ? {
          latitude: extractedCoords.latitude,
          longitude: extractedCoords.longitude,
        } : {}),
        ...(editingCommercial ? {
          contactName: normalizeOptionalText(motelForm.contactName || ''),
          contactEmail: normalizeOptionalText(motelForm.contactEmail || ''),
          contactPhone: normalizeOptionalText(motelForm.contactPhone || ''),
          adminContactName: normalizeOptionalText(motelForm.adminContactName || ''),
          adminContactEmail: normalizeOptionalText(motelForm.adminContactEmail || ''),
          adminContactPhone: normalizeOptionalText(motelForm.adminContactPhone || ''),
          operationsContactName: normalizeOptionalText(motelForm.operationsContactName || ''),
          operationsContactEmail: normalizeOptionalText(motelForm.operationsContactEmail || ''),
          operationsContactPhone: normalizeOptionalText(motelForm.operationsContactPhone || ''),
          nextBillingAt: motelForm.nextBillingAt ? motelForm.nextBillingAt : null,
          plan: motelForm.plan,
          status: motelForm.status,
          isActive: motelForm.isActive,
        } : {}),
      };
      const res = await fetch(`/api/admin/motels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedMotel = await res.json().catch(() => null);
        if (updatedMotel?.mapUrl !== normalizedMapUrl) {
          toast.error('El servidor no confirmó la nueva URL de Google Maps. No se marcó el cambio como guardado.');
          return;
        }
        await fetchMotel();
        setEditingMotel(false);
        setEditingCommercial(false);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        const message = await getResponseError(res, 'Error al actualizar motel');
        toast.error(message);
      }
    } catch (error) {
      console.error('Error updating motel:', error);
      toast.error('Error al actualizar motel');
    }
  };

  const updateStatusFlags = async (updates: { status?: MotelStatus; isActive?: boolean }) => {
    try {
      const res = await fetch(`/api/admin/motels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        fetchMotel();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        const message = await getResponseError(res, 'Error al actualizar motel');
        toast.error(message);
      }
    } catch (error) {
      console.error('Error updating motel:', error);
      toast.error('Error al actualizar motel');
    }
  };

  const handleDeleteMotel = () => {
    if (!motel) return;
    setConfirmAction({
      title: 'Eliminar motel',
      message: `Esto eliminará el motel "${motel.name}" y sus datos asociados. ¿Deseas continuar?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/motels/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setConfirmAction(null);
            router.push('/admin/motels');
            return;
          }
          const message = await getResponseError(res, 'Error al eliminar motel');
          toast.error(message);
        } catch (error) {
          console.error('Error deleting motel:', error);
          toast.error('Error al eliminar motel');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRoomId
      ? `/api/admin/rooms/${editingRoomId}`
      : '/api/admin/rooms';
    const method = editingRoomId ? 'PATCH' : 'POST';

    // Convert empty strings to null for numeric fields so Zod coercion doesn't fail
    const numericFields = ['maxPersons'] as const;
    const normalizedForm = { ...roomForm } as Record<string, unknown>;
    numericFields.forEach((f) => {
      if (normalizedForm[f] === '') normalizedForm[f] = null;
    });
    const roomPayload = { ...normalizedForm };
    ['price1h', 'price1_5h', 'price2h', 'price3h', 'price12h', 'price24h', 'priceNight'].forEach((field) => {
      delete roomPayload[field];
    });

    const weekdayRatesPayload = weekdayRateRules
      .filter((rule) => rule.weekdays.length > 0 && Number(rule.price) > 0)
      .map((rule) => ({ weekdays: rule.weekdays, duration: rule.duration, price: Number(rule.price) }));

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motelId: id,
          ...roomPayload,
          weekdayRates: weekdayRatesPayload,
        }),
      });

      if (res.ok) {
        fetchMotel();
        setShowRoomForm(false);
        setEditingRoomId(null);
        setRoomForm(createInitialRoomForm());
        setWeekdayRateRules([]);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        toast.error('Error al guardar habitación');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Error al guardar habitación');
    }
  };

  const handleEditRoom = (room: RoomType) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      description: room.description || '',
      price1h: '',
      price1_5h: '',
      price2h: '',
      price3h: '',
      price12h: '',
      price24h: '',
      priceNight: '',
      maxPersons: room.maxPersons?.toString() || '',
      amenityIds: (room.amenities ?? []).map((a) => a.amenity.id),
    });
    const groupedSpecificRates = new Map<string, WeekdayRateForm>();
    for (const rate of room.weekdayRates ?? []) {
      const key = `${rate.duration}:${rate.price}`;
      const existing = groupedSpecificRates.get(key);
      if (existing) existing.weekdays.push(rate.weekday);
      else groupedSpecificRates.set(key, { weekdays: [rate.weekday], duration: rate.duration, price: String(rate.price) });
    }
    const weekdayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    setWeekdayRateRules(Array.from(groupedSpecificRates.values()).map((rule) => ({
      ...rule,
      weekdays: [...rule.weekdays].sort((first, second) => weekdayOrder.indexOf(first) - weekdayOrder.indexOf(second)),
    })));
    setShowRoomForm(true);
    setTimeout(() => {
      roomFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const closeRoomForm = () => {
    setShowRoomForm(false);
    setEditingRoomId(null);
    setRoomForm(createInitialRoomForm());
    setWeekdayRateRules([]);
  };

  const handleDeleteRoom = async (roomId: string) => {
    setConfirmAction({
      title: 'Eliminar habitación',
      message: '¿Eliminar esta habitación? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/rooms/${roomId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            fetchMotel();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            toast.error('Error al eliminar habitación');
          }
        } catch (error) {
          console.error('Error deleting room:', error);
          toast.error('Error al eliminar habitación');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/menu-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motelId: id,
          ...categoryForm,
        }),
      });

      if (res.ok) {
        fetchMotel();
        setShowCategoryForm(false);
        setCategoryForm({ title: '', sortOrder: 0 });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        toast.error('Error al crear categoría');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error al crear categoría');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setConfirmAction({
      title: 'Eliminar categoría',
      message: '¿Eliminar esta categoría y todos sus items? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/menu-categories/${categoryId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            fetchMotel();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            toast.error('Error al eliminar categoría');
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          toast.error('Error al eliminar categoría');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCategoryId) return;

    try {
      const res = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: itemCategoryId,
          ...itemForm,
        }),
      });

      if (res.ok) {
        fetchMotel();
        setShowItemForm(false);
        setItemCategoryId(null);
        setItemForm({ name: '', price: '', description: '' });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        toast.error('Error al crear item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Error al crear item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setConfirmAction({
      title: 'Eliminar item',
      message: '¿Eliminar este item? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/menu-items/${itemId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            fetchMotel();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            toast.error('Error al eliminar item');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          toast.error('Error al eliminar item');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const createRoomPhoto = async (roomId: string, url: string) => {
    const res = await fetch('/api/admin/room-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomTypeId: roomId, url }),
    });
    if (!res.ok) throw new Error(await getResponseError(res, 'Error al agregar foto'));
  };

  const handleDeleteRoomPhoto = async (photoId: string) => {
    setConfirmAction({
      title: 'Eliminar foto',
      message: '¿Eliminar esta foto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/room-photos/${photoId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            fetchMotel();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            toast.error('Error al eliminar foto');
          }
        } catch (error) {
          console.error('Error deleting room photo:', error);
          toast.error('Error al eliminar foto');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleReorderRoomPhotos = async (
    roomId: string,
    photos: NonNullable<RoomType['roomPhotos']>
  ) => {
    const orderedPhotos = photos.map((photo, index) => ({ ...photo, order: index }));
    setMotel((prev) => prev ? {
      ...prev,
      rooms: (prev.rooms ?? []).map((room) =>
        room.id === roomId ? { ...room, roomPhotos: orderedPhotos } : room
      ),
    } : prev);

    try {
      const response = await fetch('/api/admin/room-photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomTypeId: roomId, photoIds: orderedPhotos.map((photo) => photo.id) }),
      });
      if (!response.ok) {
        throw new Error('No se pudo guardar el orden de todas las fotos');
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error('Error reordering room photos:', error);
      fetchMotel();
      toast.error('Error al reordenar fotos');
    }
  };

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?motelId=${id}`);
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    fetchMotel();
    fetchAmenities();
    fetchPromos();
    fetchCurrentUser();
  }, [id, fetchAmenities, fetchCurrentUser, fetchMotel, fetchPromos]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      fetchReviews();
    }
    if (activeTab !== 'details' && editingMotel) {
      setEditingMotel(false);
    }
    if (activeTab !== 'commercial' && editingCommercial) {
      setEditingCommercial(false);
    }
  }, [activeTab, editingMotel, editingCommercial, fetchReviews, reviews.length]);

  const handleDeleteReview = (reviewId: string) => {
    setConfirmAction({
      title: 'Eliminar reseña',
      message: '¿Eliminar esta reseña? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed');
          setReviews((prev) => prev.filter((review) => review.id !== reviewId));
          setMotel((prev) => prev ? { ...prev, ratingCount: Math.max(0, (prev.ratingCount ?? 1) - 1) } : prev);
        } catch (error) {
          console.error('Error deleting review:', error);
          toast.error('Error al eliminar la reseña');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleReorderRooms = async (orderedRooms: RoomType[]) => {
    if (!motel) return;
    const previousRooms = motel.rooms ?? [];
    const previousOrderIds = roomOrderIds;
    // La vista ordena por `room.order`; por eso también hay que actualizar ese
    // campo localmente y no sólo la posición dentro del array.
    const roomsWithUpdatedOrder = orderedRooms.map((room, index) => ({
      ...room,
      order: index,
    }));
    setRoomOrderIds(roomsWithUpdatedOrder.map((room) => room.id));
    setMotel((prev) => prev ? { ...prev, rooms: roomsWithUpdatedOrder } : prev);
    try {
      const response = await fetch('/api/admin/rooms/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motelId: motel.id,
          roomIds: roomsWithUpdatedOrder.map((room) => room.id),
        }),
      });
      if (!response.ok) {
        throw new Error('No se pudo guardar el orden de las habitaciones');
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error('Error reordering rooms:', error);
      // Restaurar inmediatamente el orden anterior si el guardado falla.
      setRoomOrderIds(previousOrderIds);
      setMotel((prev) => prev ? { ...prev, rooms: previousRooms } : prev);
      toast.error('No se pudo guardar el nuevo orden de las habitaciones. Intentá nuevamente.');
    }
  };

  const uploadFileToS3 = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/s3', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let message = 'No se pudo subir la imagen';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const data = await res.json();
    return data.url as string;
  };

  const handleFeaturedFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (exceedsImageUploadLimit(file)) {
      toast.warning(imageUploadLimitMessage);
      event.target.value = '';
      return;
    }

    setUploadingFeatured(true);
    try {
      const [webFile, appFile] = await Promise.all([
        createCroppedImageFile(file, 16 / 9, 'web'),
        createCroppedImageFile(file, 4 / 5, 'app'),
      ]);
      const [webUrl, appUrl] = await Promise.all([
        uploadFileToS3(webFile),
        uploadFileToS3(appFile),
      ]);
      setMotelForm((prev) => ({
        ...prev,
        featuredPhotoWeb: webUrl,
        featuredPhotoApp: appUrl,
        featuredPhoto: prev.featuredPhoto || webUrl,
      }));
    } catch (error) {
      console.error('Error uploading featured photo:', error);
      toast.error('No se pudo subir la imagen. Intenta nuevamente.');
    } finally {
      setUploadingFeatured(false);
      event.target.value = '';
    }
  };

  const handleFeaturedVariantFileChange = async (
    variant: 'web' | 'app',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (exceedsImageUploadLimit(file)) {
      toast.warning(imageUploadLimitMessage);
      event.target.value = '';
      return;
    }

    const setUploading = variant === 'web' ? setUploadingFeaturedWeb : setUploadingFeaturedApp;
    setUploading(true);
    try {
      const targetRatio = variant === 'web' ? 16 / 9 : 4 / 5;
      const suffix = variant === 'web' ? 'web' : 'app';
      const croppedFile = await createCroppedImageFile(file, targetRatio, suffix);
      const url = await uploadFileToS3(croppedFile);
      setMotelForm((prev) => ({
        ...prev,
        featuredPhotoWeb: variant === 'web' ? url : prev.featuredPhotoWeb,
        featuredPhotoApp: variant === 'app' ? url : prev.featuredPhotoApp,
        featuredPhoto: prev.featuredPhoto || url,
      }));
    } catch (error) {
      console.error('Error uploading featured photo variant:', error);
      toast.error('No se pudo subir la imagen. Intenta nuevamente.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRoomPhotoFileChange = async (
    roomId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const room = motel?.rooms?.find((item) => item.id === roomId);
    const availableSlots = MAX_STORED_ROOM_PHOTOS - (room?.roomPhotos?.length ?? 0);
    if (availableSlots <= 0) {
      toast.warning(`Límite de ${MAX_STORED_ROOM_PHOTOS} fotos por habitación alcanzado.`);
      event.target.value = '';
      return;
    }

    const allowedFiles = files.filter((file) => !exceedsImageUploadLimit(file)).slice(0, availableSlots);
    const rejectedBySize = files.length - files.filter((file) => !exceedsImageUploadLimit(file)).length;
    const omittedByLimit = Math.max(0, files.filter((file) => !exceedsImageUploadLimit(file)).length - availableSlots);
    if (rejectedBySize > 0) toast.warning(`${rejectedBySize} ${rejectedBySize === 1 ? 'imagen supera' : 'imágenes superan'} el máximo de 4 MB y no ${rejectedBySize === 1 ? 'se subió' : 'se subieron'}.`);
    if (omittedByLimit > 0) toast.warning(`Solo se pueden guardar ${availableSlots} fotos más en esta habitación.`);
    if (allowedFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setUploadingRoomId(roomId);
    let uploaded = 0;
    const errors: string[] = [];
    try {
      for (const file of allowedFiles) {
        try {
          const url = await uploadFileToS3(file);
          await createRoomPhoto(roomId, url);
          uploaded += 1;
        } catch (error) {
          console.error('Error uploading room photo:', error);
          errors.push(file.name);
        }
      }
      if (uploaded > 0) {
        await fetchMotel();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
        toast.success(`${uploaded} ${uploaded === 1 ? 'foto subida' : 'fotos subidas'} correctamente.`);
      }
      if (errors.length > 0) toast.error(`No se pudieron subir ${errors.length} ${errors.length === 1 ? 'foto' : 'fotos'}.`);
    } finally {
      setUploadingRoomId(null);
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!motel) {
    return (
      <div className="text-center py-8">
        {fetchError || 'Motel no encontrado'}
      </div>
    );
  }

  // Constantes seguras para evitar errores de undefined
  const rooms = sortByExplicitOrder(motel.rooms ?? [], roomOrderIds);
  const menuCategories = motel.menuCategories ?? [];
  const activePromosCount = promos.filter((promo) => promo.isActive).length;

  const featuredPhotoWeb = normalizeLocalUrl(motel.featuredPhotoWeb || motel.featuredPhoto || null);
  const featuredPhotoApp = normalizeLocalUrl(motel.featuredPhotoApp || motel.featuredPhoto || null);
  const mapsLink = getGoogleMapsExternalUrl(motel.mapUrl, [motel.address, motel.city].filter(Boolean).join(', '));

  const promoLimit = getPlanPromoLimit(motel.plan);
  const roomPhotoLimit = getPlanRoomPhotoLimit(motel.plan);

  return (
    <div className="space-y-6">
      {saveStatus === 'success' && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-xl text-sm flex items-center gap-2 z-50">
          <span>✓</span>
          Cambios guardados
        </div>
      )}
      <MotelAdminHeader
        motel={motel}
        isSuperAdmin={currentUser?.role === 'SUPERADMIN'}
        featuredPhotoWeb={featuredPhotoWeb}
        featuredPhotoApp={featuredPhotoApp}
        roomCount={rooms.length}
        promoCount={promos.length}
        onStatusChange={updateStatusFlags}
        onDelete={handleDeleteMotel}
      />

      <MotelAdminTabs
        activeTab={activeTab}
        roomCount={rooms.length}
        promoCount={promos.length}
        menuCategoryCount={menuCategories.length}
        reviewCount={motel.ratingCount ?? 0}
        onChange={setActiveTab}
      />

      {activeTab === 'promos' && (
        <div className="space-y-6">
          {!showPromoForm && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Gestiona las promociones especiales del motel
              </p>
              <button
                onClick={() => setShowPromoForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-md shadow-purple-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Promo
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold">Límite por plan ({getPlanLabel(motel.plan)}):</span>{' '}
            Básico 1 activa · Gold 5 activas · Diamond ilimitadas.
            <span className="ml-2 text-slate-500">
              Activas: {activePromosCount}/{formatLimit(promoLimit)}
            </span>
          </div>

          {showPromoForm && (
            <PromoEditorForm
              editing={Boolean(editingPromoId)}
              dirty={promoFormDirty}
              uploading={uploadingPromo}
              canPublishGlobally={currentUser?.role === 'SUPERADMIN'}
              form={promoForm}
              onChange={setPromoForm}
              onFileChange={handlePromoFileChange}
              onCancel={() => {
                setShowPromoForm(false);
                setEditingPromoId(null);
                setPromoForm(createInitialPromoForm());
              }}
              onSubmit={handleSavePromo}
            />
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {promos.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl text-slate-300">🎉</span>
                  <p className="text-slate-500 font-medium">No hay promos registradas</p>
                  <p className="text-sm text-slate-400">Creá la primera promo usando el botón de arriba</p>
                </div>
              </div>
            ) : (
              promos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} superAdmin={currentUser?.role === 'SUPERADMIN'} menuOpen={openPromoMenuId === promo.id} onEdit={handleEditPromo} onDelete={handleDeletePromo} onToggleActive={handleTogglePromoActive} onMenuChange={setOpenPromoMenuId}>

                    {promo.hasPromoCode && (
                      <PromoCodePanel
                        promoId={promo.id}
                        input={redeemInput[promo.id] || ''}
                        loading={Boolean(redeemLoading[promo.id])}
                        result={redeemResult[promo.id] || null}
                        expanded={Boolean(expandedCodes[promo.id])}
                        codes={promoCodesMap[promo.id] || []}
                        summary={promoCodesSummary[promo.id]}
                        onInputChange={(value) => setRedeemInput((prev) => ({ ...prev, [promo.id]: value }))}
                        onVerify={() => handleVerifyCode(promo.id)}
                        onConfirm={() => setConfirmAction({ title: 'Confirmar uso del código', message: 'Esta acción es irreversible. ¿Confirmar que el código fue utilizado?', confirmText: 'Confirmar uso', cancelText: 'Cancelar', danger: true, onConfirm: () => { setConfirmAction(null); handleConfirmRedeem(promo.id); } })}
                        onToggleHistory={(expanded) => { setExpandedCodes((prev) => ({ ...prev, [promo.id]: expanded })); if (expanded) fetchPromoCodes(promo.id); }}
                      />
                    )}
                </PromoCard>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-6">
          {!editingMotel ? (
            <>
              <GeneralInfoSummary motel={motel} featuredPhotoWeb={featuredPhotoWeb} featuredPhotoApp={featuredPhotoApp} />

              {/* Card 2: Ubicación */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Ubicación
                </h3>
                <dl className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">País</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.country || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Ciudad</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.city}</dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Dirección</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.address}</dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">URL de Mapa</dt>
                    <div className="mt-1 flex items-center gap-3">
                      <p className="text-sm text-slate-900 truncate flex-1">{motel.mapUrl || '-'}</p>
                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Abrir en Google Maps
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </dl>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={() => setEditingMotel(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 font-medium transition-colors shadow-md shadow-purple-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Motel
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateMotel} className="space-y-6">
              <DirtyBanner visible={motelFormDirty} />
              {/* Formulario en 3 cards igual */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={motelForm.name}
                      onChange={(e) => setMotelForm({ ...motelForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                    <textarea
                      value={motelForm.description}
                      onChange={(e) => setMotelForm({ ...motelForm, description: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <FeaturedPhotoFields
                    form={motelForm}
                    uploadingAuto={uploadingFeatured}
                    uploadingWeb={uploadingFeaturedWeb}
                    uploadingApp={uploadingFeaturedApp}
                    onAutoUpload={handleFeaturedFileChange}
                    onVariantUpload={handleFeaturedVariantFileChange}
                  />
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motelForm.isFeatured}
                        onChange={(e) => setMotelForm({ ...motelForm, isFeatured: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Motel destacado</span>
                    </label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                      <input
                        type="text"
                        value={motelForm.phone}
                        onChange={(e) => setMotelForm({ ...motelForm, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="+595..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp</label>
                      <input
                        type="text"
                        value={motelForm.whatsapp}
                        onChange={(e) => setMotelForm({ ...motelForm, whatsapp: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="+595..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <MotelLocationFields form={motelForm} onChange={setMotelForm} canEditLocation={currentUser?.role === 'SUPERADMIN'} />

              <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMotel(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'commercial' && (
        <div className="space-y-6">
          {!editingCommercial ? (
            <CommercialSummary motel={motel} onEdit={() => setEditingCommercial(true)} />
          ) : (
            <form onSubmit={handleUpdateMotel} className="space-y-6">
              <DirtyBanner visible={motelFormDirty} />
              <CommercialContactFields form={motelForm} onChange={setMotelForm} />
              <CommercialPlanFields form={motelForm} onChange={setMotelForm} />

              <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCommercial(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                >
                  Guardar configuración
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {!showRoomForm && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Gestioná las habitaciones y sus precios por tiempo
              </p>
              <button
                onClick={() => setShowRoomForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-md shadow-purple-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Habitación
              </button>
            </div>
          )}

          {showRoomForm && (
            <div ref={roomFormRef} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <RoomEditorForm
                editing={Boolean(editingRoomId)}
                dirty={roomFormDirty}
                form={roomForm}
                amenities={amenities}
                weekdayRateRules={weekdayRateRules}
                onWeekdayRateRulesChange={setWeekdayRateRules}
                onFormChange={setRoomForm}
                onCancel={closeRoomForm}
                onSubmit={handleSaveRoom}
              />
            </div>
          )}

          <RoomList
            rooms={rooms}
            planLabel={getPlanLabel(motel.plan)}
            publishedPhotoLimit={roomPhotoLimit}
            uploadingRoomId={uploadingRoomId}
            onReorder={handleReorderRooms}
            onEdit={handleEditRoom}
            onDelete={handleDeleteRoom}
            onUploadPhoto={handleRoomPhotoFileChange}
            onReorderPhotos={handleReorderRoomPhotos}
            onDeletePhoto={handleDeleteRoomPhoto}
          />
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Header con botón de nueva categoría */}
          {!showCategoryForm && !showItemForm && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Categoría
              </button>
            </div>
          )}

          <MenuForms
            showCategoryForm={showCategoryForm}
            showItemForm={showItemForm}
            categoryForm={categoryForm}
            itemForm={itemForm}
            categoryFormDirty={categoryFormDirty}
            itemFormDirty={itemFormDirty}
            onCategoryChange={setCategoryForm}
            onItemChange={setItemForm}
            onSaveCategory={handleSaveCategory}
            onSaveItem={handleSaveItem}
            onCancelCategory={() => {
              setShowCategoryForm(false);
              setCategoryForm({ title: '', sortOrder: 0 });
            }}
            onCancelItem={() => {
              setShowItemForm(false);
              setItemCategoryId(null);
              setItemForm({ name: '', price: '', description: '' });
            }}
          />

          {/* Lista de categorías */}
          <div className="space-y-4">
            {menuCategories.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl text-slate-300">🍽️</span>
                  <p className="text-slate-500 font-medium">No hay categorías de menú</p>
                  <p className="text-sm text-slate-400">Creá la primera categoría usando el botón de arriba</p>
                </div>
              </div>
            ) : (
              menuCategories.map((category) => (
                <MenuCategoryCard
                  key={category.id}
                  category={category}
                  onAddItem={(categoryId) => {
                    setItemCategoryId(categoryId);
                    setShowItemForm(true);
                  }}
                  onDeleteCategory={handleDeleteCategory}
                  onDeleteItem={handleDeleteItem}
                />
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'reviews' && (
        <ReviewsPanel
          ratingAvg={motel.ratingAvg}
          ratingCount={motel.ratingCount}
          reviews={reviews}
          loading={reviewsLoading}
          onRefresh={fetchReviews}
          onDelete={handleDeleteReview}
          canModerate={currentUser?.role === 'SUPERADMIN'}
        />
      )}

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
