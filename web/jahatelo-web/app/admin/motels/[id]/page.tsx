'use client';

import { useEffect, useMemo, useState, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DirtyBanner from '@/components/admin/DirtyBanner';

type MotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type Motel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
  city: string;
  neighborhood: string;
  address: string;
  mapUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  status: MotelStatus;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  adminContactName: string | null;
  adminContactEmail: string | null;
  adminContactPhone: string | null;
  operationsContactName: string | null;
  operationsContactEmail: string | null;
  operationsContactPhone: string | null;
  plan: string | null;
  nextBillingAt: string | null;
  isFeatured: boolean;
  featuredPhoto: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  createdAt?: string;
  updatedAt?: string;
  rooms?: RoomType[];
  menuCategories?: MenuCategory[];
};

type RoomType = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  priceLabel: string | null;
  price1h: number | null;
  price1_5h: number | null;
  price2h: number | null;
  price3h: number | null;
  price12h: number | null;
  price24h: number | null;
  priceNight: number | null;
  maxPersons: number | null;
  hasJacuzzi: boolean;
  hasPrivateGarage: boolean;
  isFeatured: boolean;
  isActive: boolean;
  amenities: Array<{
    amenity: {
      id: string;
      name: string;
      icon: string | null;
    };
  }>;
  roomPhotos?: Array<{
    id: string;
    url: string;
    order: number;
  }>;
};

type MenuCategory = {
  id: string;
  title: string;
  sortOrder: number;
  items: MenuItem[];
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

type Amenity = {
  id: string;
  name: string;
  type: string | null;
  icon: string | null;
};

type Promo = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isGlobal: boolean;
};

export default function MotelDetailPage() {
  const countryOptions = ['Paraguay', 'Argentina', 'Peru', 'Bolivia', 'Chile', 'Brasil'];
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
  const [geocoding, setGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState<'promos' | 'details' | 'rooms' | 'menu' | 'commercial'>('promos');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const [editingMotel, setEditingMotel] = useState(false);
  const [editingCommercial, setEditingCommercial] = useState(false);
  const [motelForm, setMotelForm] = useState({
    name: '',
    description: '',
    country: 'Paraguay',
    city: '',
    neighborhood: '',
    address: '',
    mapUrl: '',
    phone: '',
    whatsapp: '',
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
  });

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    priceLabel: '',
    price1h: '',
    price1_5h: '',
    price2h: '',
    price3h: '',
    price12h: '',
    price24h: '',
    priceNight: '',
    maxPersons: '',
    hasJacuzzi: false,
    hasPrivateGarage: false,
    isFeatured: false,
    amenityIds: [] as string[],
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ title: '', sortOrder: 0 });

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '' });

  // Promos state
  const createInitialPromoForm = () => ({
    title: '',
    description: '',
    imageUrl: '',
    isGlobal: false,
  });

  const [promos, setPromos] = useState<Promo[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState(createInitialPromoForm());
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);
  const [uploadingPromo, setUploadingPromo] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [promoFormDirty, setPromoFormDirty] = useState(false);
  const [motelFormDirty, setMotelFormDirty] = useState(false);
  const [roomFormDirty, setRoomFormDirty] = useState(false);
  const [categoryFormDirty, setCategoryFormDirty] = useState(false);
  const [itemFormDirty, setItemFormDirty] = useState(false);
  const promoFormSnapshotRef = useRef('');
  const motelFormSnapshotRef = useRef('');
  const roomFormSnapshotRef = useRef('');
  const categoryFormSnapshotRef = useRef('');
  const itemFormSnapshotRef = useRef('');

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    fetchMotel();
    fetchAmenities();
    fetchPromos();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'details' && editingMotel) {
      setEditingMotel(false);
    }
    if (activeTab !== 'commercial' && editingCommercial) {
      setEditingCommercial(false);
    }
  }, [activeTab, editingMotel, editingCommercial]);

  useEffect(() => {
    if (showPromoForm) {
      promoFormSnapshotRef.current = JSON.stringify(promoForm);
      setPromoFormDirty(false);
    }
  }, [showPromoForm, promoForm]);

  useEffect(() => {
    if (!showPromoForm) return;
    const snapshot = promoFormSnapshotRef.current;
    if (!snapshot) return;
    setPromoFormDirty(JSON.stringify(promoForm) !== snapshot);
  }, [promoForm, showPromoForm]);

  useEffect(() => {
    if (editingMotel || editingCommercial) {
      motelFormSnapshotRef.current = JSON.stringify(motelForm);
      setMotelFormDirty(false);
    }
  }, [editingMotel, editingCommercial, motelForm]);

  useEffect(() => {
    if (!editingMotel && !editingCommercial) return;
    const snapshot = motelFormSnapshotRef.current;
    if (!snapshot) return;
    setMotelFormDirty(JSON.stringify(motelForm) !== snapshot);
  }, [motelForm, editingMotel, editingCommercial]);

  useEffect(() => {
    if (showRoomForm) {
      roomFormSnapshotRef.current = JSON.stringify(roomForm);
      setRoomFormDirty(false);
    }
  }, [showRoomForm, roomForm]);

  useEffect(() => {
    if (!showRoomForm) return;
    const snapshot = roomFormSnapshotRef.current;
    if (!snapshot) return;
    setRoomFormDirty(JSON.stringify(roomForm) !== snapshot);
  }, [roomForm, showRoomForm]);

  useEffect(() => {
    if (showCategoryForm) {
      categoryFormSnapshotRef.current = JSON.stringify(categoryForm);
      setCategoryFormDirty(false);
    }
  }, [showCategoryForm, categoryForm]);

  useEffect(() => {
    if (!showCategoryForm) return;
    const snapshot = categoryFormSnapshotRef.current;
    if (!snapshot) return;
    setCategoryFormDirty(JSON.stringify(categoryForm) !== snapshot);
  }, [categoryForm, showCategoryForm]);

  useEffect(() => {
    if (showItemForm) {
      itemFormSnapshotRef.current = JSON.stringify(itemForm);
      setItemFormDirty(false);
    }
  }, [showItemForm, itemForm]);

  useEffect(() => {
    if (!showItemForm) return;
    const snapshot = itemFormSnapshotRef.current;
    if (!snapshot) return;
    setItemFormDirty(JSON.stringify(itemForm) !== snapshot);
  }, [itemForm, showItemForm]);

  const fetchMotel = async () => {
    try {
      const res = await fetch(`/api/admin/motels/${id}`);
      if (!res.ok) {
        setMotel(null);
        return;
      }
      const data = await res.json();
      setMotel(data);
      setMotelForm({
        name: data.name,
        description: data.description || '',
        country: data.country || 'Paraguay',
        city: data.city || '',
        neighborhood: data.neighborhood || '',
        address: data.address || '',
        mapUrl: data.mapUrl || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
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
        featuredPhoto: data.featuredPhoto || '',
      });
    } catch (error) {
      console.error('Error fetching motel:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await fetch('/api/admin/amenities');
      const data = await res.json();
      setAmenities(data);
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const fetchPromos = async () => {
    try {
      const res = await fetch(`/api/admin/promos?motelId=${id}`);
      const data = await res.json();
      setPromos(data);
    } catch (error) {
      console.error('Error fetching promos:', error);
    }
  };

  const fetchCurrentUser = async () => {
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
  };

  const getResponseError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      if (data?.error) return data.error as string;
      if (data?.message) return data.message as string;
    } catch (error) {
      console.error('Error parsing response:', error);
    }
    return fallback;
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromoId) {
        // Update existing promo
        const res = await fetch(`/api/admin/promos/${editingPromoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promoForm),
        });
        if (res.ok) {
          fetchPromos();
          setShowPromoForm(false);
          setEditingPromoId(null);
          setPromoForm(createInitialPromoForm());
        } else {
          const message = await getResponseError(res, 'Error al actualizar promo');
          alert(message);
        }
      } else {
        // Create new promo
        const res = await fetch('/api/admin/promos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...promoForm, motelId: id }),
        });
        if (res.ok) {
          fetchPromos();
          setShowPromoForm(false);
          setPromoForm(createInitialPromoForm());
        } else {
          const message = await getResponseError(res, 'Error al crear promo');
          alert(message);
        }
      }
    } catch (error) {
      console.error('Error saving promo:', error);
      alert('Error al guardar promo');
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
          }
        } catch (error) {
          console.error('Error deleting promo:', error);
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleEditPromo = (promo: Promo) => {
    setEditingPromoId(promo.id);
    setPromoForm({
      title: promo.title,
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      isGlobal: promo.isGlobal || false,
    });
    setShowPromoForm(true);
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
      alert('Error al subir la imagen');
    } finally {
      setUploadingPromo(false);
    }
  };

  const handleUpdateMotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/motels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motelForm),
      });

      if (res.ok) {
        fetchMotel();
        setEditingMotel(false);
        setEditingCommercial(false);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        alert('Error al actualizar motel');
      }
    } catch (error) {
      console.error('Error updating motel:', error);
      alert('Error al actualizar motel');
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
        alert(message);
      }
    } catch (error) {
      console.error('Error updating motel:', error);
      alert('Error al actualizar motel');
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
          alert(message);
        } catch (error) {
          console.error('Error deleting motel:', error);
          alert('Error al eliminar motel');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleGeocode = async () => {
    if (!motelForm.address || !motelForm.city) {
      alert('Por favor ingresa dirección y ciudad antes de geocodificar');
      return;
    }

    setGeocoding(true);
    try {
      const res = await fetch(`/api/admin/motels/${id}/geocode`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Coordenadas obtenidas exitosamente!\nLat: ${data.motel.latitude}\nLng: ${data.motel.longitude}`);
        fetchMotel(); // Reload motel to get updated coordinates
      } else {
        alert(data.error || 'Error al geocodificar');
      }
    } catch (error) {
      console.error('Error geocoding motel:', error);
      alert('Error al geocodificar motel');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRoomId
      ? `/api/admin/rooms/${editingRoomId}`
      : '/api/admin/rooms';
    const method = editingRoomId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motelId: id,
          ...roomForm,
        }),
      });

      if (res.ok) {
        fetchMotel();
        setShowRoomForm(false);
        setEditingRoomId(null);
        setRoomForm({
          name: '',
          description: '',
          basePrice: '',
          priceLabel: '',
          price1h: '',
          price1_5h: '',
          price2h: '',
          price3h: '',
          price12h: '',
          price24h: '',
          priceNight: '',
          maxPersons: '',
          hasJacuzzi: false,
          hasPrivateGarage: false,
          isFeatured: false,
          amenityIds: []
        });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        alert('Error al guardar habitación');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error al guardar habitación');
    }
  };

  const handleEditRoom = (room: RoomType) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      description: room.description || '',
      basePrice: room.basePrice?.toString() || '',
      priceLabel: room.priceLabel || '',
      price1h: room.price1h?.toString() || '',
      price1_5h: room.price1_5h?.toString() || '',
      price2h: room.price2h?.toString() || '',
      price3h: room.price3h?.toString() || '',
      price12h: room.price12h?.toString() || '',
      price24h: room.price24h?.toString() || '',
      priceNight: room.priceNight?.toString() || '',
      maxPersons: room.maxPersons?.toString() || '',
      hasJacuzzi: room.hasJacuzzi || false,
      hasPrivateGarage: room.hasPrivateGarage || false,
      isFeatured: room.isFeatured || false,
      amenityIds: (room.amenities ?? []).map((a) => a.amenity.id),
    });
    setShowRoomForm(true);
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
            alert('Error al eliminar habitación');
          }
        } catch (error) {
          console.error('Error deleting room:', error);
          alert('Error al eliminar habitación');
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
        alert('Error al crear categoría');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al crear categoría');
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
            alert('Error al eliminar categoría');
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          alert('Error al eliminar categoría');
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
        alert('Error al crear item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error al crear item');
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
            alert('Error al eliminar item');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Error al eliminar item');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setRoomForm((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId],
    }));
  };

  const handleAddRoomPhoto = async (roomId: string, url: string) => {
    if (!url.trim()) return;

    try {
      const res = await fetch('/api/admin/room-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: roomId,
          url: url.trim(),
          order: 0,
        }),
      });

      if (res.ok) {
        fetchMotel();
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        const message = await getResponseError(res, 'Error al agregar foto');
        alert(message);
      }
    } catch (error) {
      console.error('Error adding room photo:', error);
      alert('Error al agregar foto');
    }
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
            alert('Error al eliminar foto');
          }
        } catch (error) {
          console.error('Error deleting room photo:', error);
          alert('Error al eliminar foto');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleReorderRoomPhotos = async (roomId: string, photos: any[]) => {
    try {
      // Actualizar el orden de todas las fotos en batch
      const updates = photos.map((photo, index) =>
        fetch(`/api/admin/room-photos/${photo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      );

      await Promise.all(updates);
      fetchMotel();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error('Error reordering room photos:', error);
      alert('Error al reordenar fotos');
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
      throw new Error('No se pudo subir la imagen');
    }

    const data = await res.json();
    return data.url as string;
  };

  const handleFeaturedFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFeatured(true);
    try {
      const url = await uploadFileToS3(file);
      setMotelForm((prev) => ({ ...prev, featuredPhoto: url }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error('Error uploading featured photo:', error);
      alert('No se pudo subir la imagen. Intenta nuevamente.');
    } finally {
      setUploadingFeatured(false);
      event.target.value = '';
    }
  };

  const handleRoomPhotoFileChange = async (
    roomId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingRoomId(roomId);
    try {
      const url = await uploadFileToS3(file);
      await handleAddRoomPhoto(roomId, url);
    } catch (error) {
      console.error('Error uploading room photo:', error);
      alert('No se pudo subir la imagen. Intenta nuevamente.');
    } finally {
      setUploadingRoomId(null);
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!motel) {
    return <div className="text-center py-8">Motel no encontrado</div>;
  }

  // Constantes seguras para evitar errores de undefined
  const rooms = motel.rooms ?? [];
  const menuCategories = motel.menuCategories ?? [];
  const activePromosCount = promos.filter((promo) => promo.isActive).length;

  // Constantes seguras para valores numéricos
  const safeRatingAvg = typeof motel.ratingAvg === 'number' ? motel.ratingAvg : 0;
  const safeRatingCount = typeof motel.ratingCount === 'number' ? motel.ratingCount : 0;

  // Función helper para formatear precios de forma segura
  const formatPrice = (price: number | null | undefined): string => {
    const numPrice = typeof price === 'number' ? price : 0;
    return numPrice.toLocaleString();
  };

  const normalizePlan = (plan: string | null | undefined) => (plan || 'BASIC').toUpperCase();

  const getPlanLabel = (plan: string | null | undefined) => {
    const normalized = normalizePlan(plan);
    if (normalized === 'GOLD') return 'Gold';
    if (normalized === 'DIAMOND') return 'Diamond';
    if (normalized === 'FREE') return 'Free';
    return 'Básico';
  };

  const getPromoLimit = (plan: string | null | undefined) => {
    const normalized = normalizePlan(plan);
    if (normalized === 'GOLD') return 5;
    if (normalized === 'DIAMOND') return Number.POSITIVE_INFINITY;
    return 1;
  };

  const getRoomPhotoLimit = (plan: string | null | undefined) => {
    const normalized = normalizePlan(plan);
    if (normalized === 'GOLD') return 3;
    if (normalized === 'DIAMOND') return Number.POSITIVE_INFINITY;
    return 1;
  };

  const formatLimit = (limit: number) => (Number.isFinite(limit) ? `${limit}` : 'Ilimitadas');

  const whatsappLink = motel.whatsapp ? `https://wa.me/${motel.whatsapp.replace(/\D/g, '')}` : '';
  const phoneLink = motel.phone ? `tel:${motel.phone}` : '';
  const promoLimit = getPromoLimit(motel.plan);
  const roomPhotoLimit = getRoomPhotoLimit(motel.plan);

  return (
    <div className="space-y-6">
      {saveStatus === 'success' && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-xl text-sm flex items-center gap-2 z-50">
          <span>✓</span>
          Cambios guardados
        </div>
      )}
      {/* Cabecera de la página */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                  motel.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : motel.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {motel.status === 'PENDING' ? 'Pendiente' : motel.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                  motel.isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span>{motel.isActive ? '✅' : '⏸'}</span>
                {motel.isActive ? 'Habilitado' : 'Deshabilitado'}
              </span>
              {motel.plan && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-900 text-white">
                  {motel.plan}
                </span>
              )}
            </div>
            {currentUser?.role === 'SUPERADMIN' && (
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                  <select
                    value={motel.status}
                    onChange={(e) => updateStatusFlags({ status: e.target.value as MotelStatus })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="APPROVED">Aprobado</option>
                    <option value="REJECTED">Rechazado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Habilitado</label>
                  <select
                    value={motel.isActive ? 'true' : 'false'}
                    onChange={(e) => updateStatusFlags({ isActive: e.target.value === 'true' })}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">{motel.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {motel.country && (
                  <>
                    <span>{motel.country}</span>
                    <span className="text-slate-300">•</span>
                  </>
                )}
                <span>{motel.city}</span>
                <span className="text-slate-300">•</span>
                <span>{motel.neighborhood}</span>
                {motel.address && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{motel.address}</span>
                  </>
                )}
              </div>
              {motel.description && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{motel.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {motel.mapUrl && (
                <a
                  href={motel.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  <LucideIcons.MapPin className="w-3.5 h-3.5" />
                  Ver mapa
                </a>
              )}
              {motel.website && (
                <a
                  href={motel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  <LucideIcons.Globe className="w-3.5 h-3.5" />
                  Sitio web
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <LucideIcons.MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
              {phoneLink && (
                <a
                  href={phoneLink}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  <LucideIcons.Phone className="w-3.5 h-3.5" />
                  Llamar
                </a>
              )}
              {currentUser?.role === 'SUPERADMIN' && (
                <button
                  type="button"
                  onClick={handleDeleteMotel}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 transition-colors"
                >
                  <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {motel.featuredPhoto ? (
              <img
                src={motel.featuredPhoto}
                alt={motel.name}
                className="h-56 w-full object-cover"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-400">
                <LucideIcons.Image className="h-10 w-10" />
              </div>
            )}
            {motel.featuredPhoto && (
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/60 to-transparent" />
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Calificación</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {safeRatingAvg.toFixed(1)} <span className="text-sm font-medium text-slate-500">({safeRatingCount})</span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Habitaciones</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{rooms.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Promos activas</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{promos.length}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Creado el {motel.createdAt ? new Date(motel.createdAt).toLocaleDateString('es-AR') : '—'} · Última actualización {motel.updatedAt ? new Date(motel.updatedAt).toLocaleDateString('es-AR') : 'reciente'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('promos')}
          className={`px-5 py-3 font-medium text-sm transition-colors ${
            activeTab === 'promos'
              ? 'border-b-2 border-purple-600 text-purple-700 -mb-[2px]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Promos <span className="ml-1 opacity-70">({promos.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-3 font-medium text-sm transition-colors ${
            activeTab === 'details'
              ? 'border-b-2 border-purple-600 text-purple-700 -mb-[2px]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Detalles
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-5 py-3 font-medium text-sm transition-colors ${
            activeTab === 'rooms'
              ? 'border-b-2 border-purple-600 text-purple-700 -mb-[2px]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Habitaciones <span className="ml-1 opacity-70">({rooms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-5 py-3 font-medium text-sm transition-colors ${
            activeTab === 'menu'
              ? 'border-b-2 border-purple-600 text-purple-700 -mb-[2px]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Menú <span className="ml-1 opacity-70">({menuCategories.length})</span>
        </button>
        <Link
          href={`/admin/motels/${id}/analytics`}
          className="px-5 py-3 font-medium text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Analytics
        </Link>
      </div>

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
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingPromoId ? 'Editar Promo' : 'Nueva Promo'}
                </h3>
                <button
                  onClick={() => {
                    setShowPromoForm(false);
                    setEditingPromoId(null);
                    setPromoForm(createInitialPromoForm());
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DirtyBanner visible={promoFormDirty} />
              <form onSubmit={handleSavePromo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
                  <input
                    type="text"
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ej: 2x1 en habitaciones los fines de semana"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                  <textarea
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={3}
                    placeholder="Detalles de la promoción (opcional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL de Imagen</label>
                  <input
                    type="text"
                    value={promoForm.imageUrl}
                    onChange={(e) => setPromoForm({ ...promoForm, imageUrl: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://ejemplo.com/promo.jpg"
                  />
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <label
                      className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer font-medium hover:bg-slate-200 transition ${
                        uploadingPromo ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePromoFileChange}
                        disabled={uploadingPromo}
                      />
                      {uploadingPromo ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l3 3" />
                          </svg>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4 4 4m-4-4v9" />
                          </svg>
                          Subir desde archivo
                        </>
                      )}
                    </label>
                    <p className="text-xs text-slate-500">Formatos sugeridos: JPG o PNG.</p>
                  </div>
                  {promoForm.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={promoForm.imageUrl}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>
                {currentUser?.role === 'SUPERADMIN' && (
                  <div className="border-t border-slate-200 pt-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={promoForm.isGlobal}
                        onChange={(e) => setPromoForm({ ...promoForm, isGlobal: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm text-slate-700">
                        <span className="font-medium">Mostrar en Home</span>
                        <span className="text-xs text-slate-500 block">Esta promo aparecerá en la sección de promociones del Home de la app</span>
                      </span>
                    </label>
                  </div>
                )}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoForm(false);
                      setEditingPromoId(null);
                      setPromoForm(createInitialPromoForm());
                    }}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                  >
                    {editingPromoId ? 'Guardar Cambios' : 'Crear Promo'}
                  </button>
                </div>
              </form>
            </div>
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
                <div key={promo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-purple-200 transition-colors">
                  {promo.imageUrl && (
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 flex-1">{promo.title}</h3>
                      {currentUser?.role === 'SUPERADMIN' && promo.isGlobal && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">
                          🏠 Home
                        </span>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-sm text-slate-600 mb-3">{promo.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => handleEditPromo(promo)}
                        className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        Editar
                      </button>
                      <details className="relative">
                        <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                          </svg>
                        </summary>
                        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-6">
          {!editingMotel ? (
            <>
              {/* Card 1: Datos Generales */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Datos generales</h3>
                  <span className="text-xs text-slate-500">ID: {motel.id}</span>
                </div>
                <dl className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Nombre</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{motel.name}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Slug</dt>
                    <dd className="mt-1 font-mono text-sm text-slate-700">{motel.slug}</dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Descripción</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.description || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Teléfono</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.phone || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">WhatsApp</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.whatsapp || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Sitio web</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.website || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Instagram</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.instagram || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Contacto usuarios</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.contactName || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Correo usuarios</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.contactEmail || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Teléfono usuarios</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.contactPhone || '-'}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Calificación</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {safeRatingAvg.toFixed(1)} ⭐ {safeRatingCount === 0 ? '(Sin reseñas aún)' : `(${safeRatingCount} ${safeRatingCount === 1 ? 'reseña' : 'reseñas'})`}
                    </dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Foto principal</dt>
                    {motel.featuredPhoto ? (
                      <div className="mt-2">
                        <img
                          src={motel.featuredPhoto}
                          alt={motel.name}
                          className="w-full max-w-md h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                        />
                        <p className="mt-2 text-xs text-slate-500 truncate">{motel.featuredPhoto}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">Sin foto principal</p>
                    )}
                  </div>
                </dl>
              </div>

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
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Barrio</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.neighborhood}</dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">Dirección</dt>
                    <dd className="mt-1 text-sm text-slate-900">{motel.address}</dd>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <dt className="text-xs font-medium text-slate-500 uppercase">URL de Mapa</dt>
                    <div className="mt-1 flex items-center gap-3">
                      <p className="text-sm text-slate-900 truncate flex-1">{motel.mapUrl || '-'}</p>
                      {motel.mapUrl && (
                        <a
                          href={motel.mapUrl}
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL Foto Principal</label>
                    <input
                      type="text"
                      value={motelForm.featuredPhoto}
                      onChange={(e) => setMotelForm({ ...motelForm, featuredPhoto: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <label
                        className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer font-medium hover:bg-slate-200 transition ${
                          uploadingFeatured ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFeaturedFileChange}
                          disabled={uploadingFeatured}
                        />
                        {uploadingFeatured ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l3 3" />
                            </svg>
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4 4 4m-4-4v9" />
                            </svg>
                            Subir desde archivo
                          </>
                        )}
                      </label>
                      <p className="text-xs text-slate-500">Formatos sugeridos: JPG o PNG.</p>
                    </div>
                    {motelForm.featuredPhoto && (
                      <div className="mt-3">
                        <img
                          src={motelForm.featuredPhoto}
                          alt="Preview"
                          className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                  </div>
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
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contacto usuarios</label>
                      <input
                        type="text"
                        value={motelForm.contactName}
                        onChange={(e) => setMotelForm({ ...motelForm, contactName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Correo usuarios</label>
                      <input
                        type="email"
                        value={motelForm.contactEmail}
                        onChange={(e) => setMotelForm({ ...motelForm, contactEmail: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="correo@dominio.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono usuarios</label>
                      <input
                        type="text"
                        value={motelForm.contactPhone}
                        onChange={(e) => setMotelForm({ ...motelForm, contactPhone: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="+595..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Ubicación
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
                    <select
                      value={motelForm.country}
                      onChange={(e) => setMotelForm({ ...motelForm, country: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                    >
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
                    <input
                      type="text"
                      value={motelForm.city}
                      onChange={(e) => setMotelForm({ ...motelForm, city: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Barrio</label>
                    <input
                      type="text"
                      value={motelForm.neighborhood}
                      onChange={(e) => setMotelForm({ ...motelForm, neighborhood: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={motelForm.address}
                        onChange={(e) => setMotelForm({ ...motelForm, address: e.target.value })}
                        className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleGeocode}
                        disabled={geocoding || !motelForm.address || !motelForm.city}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      >
                        <LucideIcons.MapPin className="w-4 h-4" />
                        {geocoding ? 'Geocodificando...' : 'Obtener coordenadas'}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL de Mapa</label>
                    <input
                      type="text"
                      value={motelForm.mapUrl}
                      onChange={(e) => setMotelForm({ ...motelForm, mapUrl: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              </div>

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
            <>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Contactos administrativos
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contacto administrativo</p>
                    <p className="text-slate-900 font-medium">{motel.adminContactName || '-'}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Teléfono: {motel.adminContactPhone || '-'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Correo: {motel.adminContactEmail || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contacto operativo</p>
                    <p className="text-slate-900 font-medium">{motel.operationsContactName || '-'}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Teléfono: {motel.operationsContactPhone || '-'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Correo: {motel.operationsContactEmail || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Facturación y estado
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Plan</label>
                    <p className="mt-1 text-slate-900">{motel.plan || 'BASIC'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Próxima facturación</label>
                    <p className="mt-1 text-slate-900">
                      {motel.nextBillingAt ? new Date(motel.nextBillingAt).toLocaleDateString('es-AR') : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Estado</label>
                    <p className="mt-1 font-semibold">
                      {motel.status === 'PENDING'
                        ? 'Pendiente'
                        : motel.status === 'APPROVED'
                        ? 'Aprobado'
                        : 'Rechazado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Habilitado</label>
                    <p className="mt-1 font-semibold">{motel.isActive ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase">Destacado</label>
                    <div className="mt-1">
                      {motel.isFeatured ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">
                          ⭐ Destacado en app
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">No destacado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex">
                <button
                  onClick={() => setEditingCommercial(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar configuración
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateMotel} className="space-y-6">
              <DirtyBanner visible={motelFormDirty} />
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Contactos
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Contacto administrativo</label>
                    <input
                      type="text"
                      value={motelForm.adminContactName}
                      onChange={(e) => setMotelForm({ ...motelForm, adminContactName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={motelForm.adminContactPhone}
                      onChange={(e) => setMotelForm({ ...motelForm, adminContactPhone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Teléfono"
                    />
                    <input
                      type="email"
                      value={motelForm.adminContactEmail}
                      onChange={(e) => setMotelForm({ ...motelForm, adminContactEmail: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Correo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Contacto operativo</label>
                    <input
                      type="text"
                      value={motelForm.operationsContactName}
                      onChange={(e) => setMotelForm({ ...motelForm, operationsContactName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={motelForm.operationsContactPhone}
                      onChange={(e) => setMotelForm({ ...motelForm, operationsContactPhone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Teléfono"
                    />
                    <input
                      type="email"
                      value={motelForm.operationsContactEmail}
                      onChange={(e) => setMotelForm({ ...motelForm, operationsContactEmail: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Correo"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Plan y estado
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Próxima facturación</label>
                    <input
                      type="datetime-local"
                      value={motelForm.nextBillingAt}
                      onChange={(e) => setMotelForm({ ...motelForm, nextBillingAt: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motelForm.isFeatured}
                        onChange={(e) => setMotelForm({ ...motelForm, isFeatured: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Destacado</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Habilitado</label>
                    <select
                      value={motelForm.isActive.toString()}
                      onChange={(e) =>
                        setMotelForm({ ...motelForm, isActive: e.target.value === 'true' })
                      }
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="true">Habilitado</option>
                      <option value="false">Deshabilitado</option>
                    </select>
                  </div>
                </div>
              </div>

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
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingRoomId ? 'Editar Habitación' : 'Nueva Habitación'}
                </h3>
                <button
                  onClick={() => {
                    setShowRoomForm(false);
                    setEditingRoomId(null);
                    setRoomForm({
                      name: '',
                      description: '',
                      basePrice: '',
                      priceLabel: '',
                      price1h: '',
                      price1_5h: '',
                      price2h: '',
                      price3h: '',
                      price12h: '',
                      price24h: '',
                      priceNight: '',
                      maxPersons: '',
                      hasJacuzzi: false,
                      hasPrivateGarage: false,
                      isFeatured: false,
                      amenityIds: []
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DirtyBanner visible={roomFormDirty} />
              <form onSubmit={handleSaveRoom} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ej: Suite Romántica"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={2}
                    placeholder="Descripción opcional de la habitación"
                  />
                </div>

                {/* Precios por tiempo */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Precios por Tiempo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">1h</label>
                      <input
                        type="number"
                        value={roomForm.price1h}
                        onChange={(e) => setRoomForm({ ...roomForm, price1h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">1.5h</label>
                      <input
                        type="number"
                        value={roomForm.price1_5h}
                        onChange={(e) => setRoomForm({ ...roomForm, price1_5h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">2h</label>
                      <input
                        type="number"
                        value={roomForm.price2h}
                        onChange={(e) => setRoomForm({ ...roomForm, price2h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">3h</label>
                      <input
                        type="number"
                        value={roomForm.price3h}
                        onChange={(e) => setRoomForm({ ...roomForm, price3h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">12h</label>
                      <input
                        type="number"
                        value={roomForm.price12h}
                        onChange={(e) => setRoomForm({ ...roomForm, price12h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">24h</label>
                      <input
                        type="number"
                        value={roomForm.price24h}
                        onChange={(e) => setRoomForm({ ...roomForm, price24h: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Noche</label>
                      <input
                        type="number"
                        value={roomForm.priceNight}
                        onChange={(e) => setRoomForm({ ...roomForm, priceNight: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Gs."
                      />
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Características</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Capacidad Máxima
                      </label>
                      <input
                        type="number"
                        value={roomForm.maxPersons}
                        onChange={(e) => setRoomForm({ ...roomForm, maxPersons: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Número de personas"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomForm.hasJacuzzi}
                        onChange={(e) => setRoomForm({ ...roomForm, hasJacuzzi: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm text-slate-700">🛁 Jacuzzi</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomForm.hasPrivateGarage}
                        onChange={(e) => setRoomForm({ ...roomForm, hasPrivateGarage: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm text-slate-700">🚗 Garaje Privado</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomForm.isFeatured}
                        onChange={(e) => setRoomForm({ ...roomForm, isFeatured: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-600"
                      />
                      <span className="text-sm text-slate-700">⭐ Destacada</span>
                    </label>
                  </div>
                </div>

                {/* Amenities */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((amenity) => (
                      <label key={amenity.id} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roomForm.amenityIds.includes(amenity.id)}
                          onChange={() => toggleAmenity(amenity.id)}
                          className="rounded text-purple-600 focus:ring-purple-600"
                        />
                        <span className="text-sm text-slate-700">{amenity.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Compatibilidad legacy */}
                <details className="border-t border-slate-200 pt-4">
                  <summary className="text-xs font-medium text-slate-500 cursor-pointer uppercase tracking-wide">
                    Campos Legacy (compatibilidad)
                  </summary>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Precio Base
                      </label>
                      <input
                        type="number"
                        value={roomForm.basePrice}
                        onChange={(e) => setRoomForm({ ...roomForm, basePrice: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Etiqueta Precio
                      </label>
                      <input
                        type="text"
                        value={roomForm.priceLabel}
                        onChange={(e) => setRoomForm({ ...roomForm, priceLabel: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="ej. por 3 horas"
                      />
                    </div>
                  </div>
                </details>

                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomForm(false);
                      setEditingRoomId(null);
                      setRoomForm({
                        name: '',
                        description: '',
                        basePrice: '',
                        priceLabel: '',
                        price1h: '',
                        price1_5h: '',
                        price2h: '',
                        price3h: '',
                        price12h: '',
                        price24h: '',
                        priceNight: '',
                        maxPersons: '',
                        hasJacuzzi: false,
                        hasPrivateGarage: false,
                        isFeatured: false,
                        amenityIds: []
                      });
                    }}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                  >
                    {editingRoomId ? 'Actualizar Habitación' : 'Crear Habitación'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl text-slate-300">🛏️</span>
                  <p className="text-slate-500 font-medium">No hay habitaciones registradas</p>
                  <p className="text-sm text-slate-400">Creá la primera habitación usando el botón de arriba</p>
                </div>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-purple-200 transition-colors">
                  {/* Parte superior: Nombre + Badges */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{room.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {room.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">
                            ⭐ Destacada
                          </span>
                        )}
                        {room.hasJacuzzi && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">
                            🛁 Jacuzzi
                          </span>
                        )}
                        {room.hasPrivateGarage && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                            🚗 Garage privado
                          </span>
                        )}
                        {room.maxPersons && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
                            👥 Hasta {room.maxPersons} {room.maxPersons === 1 ? 'persona' : 'personas'}
                          </span>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-sm text-slate-600 mt-3">{room.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRoom(room)}
                        className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        Editar
                      </button>
                      <details className="relative">
                        <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                          </svg>
                        </summary>
                        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Parte media: Precios */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Precios</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {room.price1h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">1 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price1h)}</div>
                        </div>
                      )}
                      {room.price1_5h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">1.5 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price1_5h)}</div>
                        </div>
                      )}
                      {room.price2h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">2 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price2h)}</div>
                        </div>
                      )}
                      {room.price3h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">3 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price3h)}</div>
                        </div>
                      )}
                      {room.price12h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">12 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price12h)}</div>
                        </div>
                      )}
                      {room.price24h && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">24 h</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.price24h)}</div>
                        </div>
                      )}
                      {room.priceNight && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">Noche</div>
                          <div className="font-semibold text-slate-900">Gs. {formatPrice(room.priceNight)}</div>
                        </div>
                      )}
                      {room.basePrice && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg">
                          <div className="text-xs text-slate-500 mb-0.5">Base{room.priceLabel ? ` (${room.priceLabel})` : ''}</div>
                          <div className="font-semibold text-slate-700">Gs. {formatPrice(room.basePrice)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parte inferior: Amenities */}
                  {(room.amenities?.length ?? 0) > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {(room.amenities ?? []).map((a) => {
                          const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
                          const IconComponent = a.amenity.icon ? iconMap[a.amenity.icon] : undefined;
                          return (
                            <span
                              key={a.amenity.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full font-medium"
                            >
                              {IconComponent && <IconComponent size={14} />}
                              {a.amenity.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fotos de la habitación */}
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Fotos</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Límite por plan ({getPlanLabel(motel.plan)}): Básico 1 · Gold 3 · Diamond ilimitadas.
                      <span className="ml-2">
                        Esta habitación tiene {(room.roomPhotos?.length ?? 0)}/{formatLimit(roomPhotoLimit)}.
                      </span>
                    </p>
                    <div className="space-y-3">
                      {(room.roomPhotos?.length ?? 0) > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {(room.roomPhotos ?? [])
                            .sort((a, b) => a.order - b.order)
                            .map((photo, index) => (
                            <div
                              key={photo.id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedPhotoId(photo.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverPhotoId(photo.id);
                              }}
                              onDragLeave={() => {
                                setDragOverPhotoId(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (!draggedPhotoId || draggedPhotoId === photo.id) return;

                                const photos = [...(room.roomPhotos ?? [])].sort((a, b) => a.order - b.order);
                                const draggedIndex = photos.findIndex(p => p.id === draggedPhotoId);
                                const targetIndex = photos.findIndex(p => p.id === photo.id);

                                const [draggedItem] = photos.splice(draggedIndex, 1);
                                photos.splice(targetIndex, 0, draggedItem);

                                handleReorderRoomPhotos(room.id, photos);
                                setDraggedPhotoId(null);
                                setDragOverPhotoId(null);
                              }}
                              onDragEnd={() => {
                                setDraggedPhotoId(null);
                                setDragOverPhotoId(null);
                              }}
                              className={`relative group cursor-move transition-all ${
                                draggedPhotoId === photo.id ? 'opacity-50 scale-95' : ''
                              } ${
                                dragOverPhotoId === photo.id && draggedPhotoId !== photo.id
                                  ? 'ring-2 ring-purple-600 scale-105'
                                  : ''
                              }`}
                            >
                              <img
                                src={photo.url}
                                alt="Room photo"
                                className="w-full h-32 object-cover rounded-lg border border-slate-200 pointer-events-none"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23f1f5f9" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-slate-900 bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                                {index + 1}
                              </div>
                              <button
                                onClick={() => handleDeleteRoomPhoto(photo.id)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                title="Eliminar foto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-slate-900 bg-opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                                  Arrastrá para reordenar
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          id={`photo-url-${room.id}`}
                          placeholder="URL de la foto"
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`photo-url-${room.id}`) as HTMLInputElement;
                            if (input?.value) {
                              handleAddRoomPhoto(room.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="inline-flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar Foto
                        </button>
                        <label
                          className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-200 transition ${
                            uploadingRoomId === room.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleRoomPhotoFileChange(room.id, event)}
                            disabled={uploadingRoomId === room.id}
                          />
                          {uploadingRoomId === room.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l3 3" />
                              </svg>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4 4 4m-4-4v9" />
                              </svg>
                              Subir archivo
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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

          {/* Formulario de nueva categoría */}
          {showCategoryForm && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Nueva Categoría</h3>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryForm({ title: '', sortOrder: 0 });
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DirtyBanner visible={categoryFormDirty} />
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ej: Bebidas, Comidas, etc."
                    required
                  />
                </div>
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setCategoryForm({ title: '', sortOrder: 0 });
                    }}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                  >
                    Crear Categoría
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Formulario de nuevo item */}
          {showItemForm && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Nuevo Item</h3>
                <button
                  onClick={() => {
                    setShowItemForm(false);
                    setItemCategoryId(null);
                    setItemForm({ name: '', price: '', description: '' });
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DirtyBanner visible={itemFormDirty} />
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ej: Coca-Cola, Hamburguesa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Gs."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción <span className="text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción del item"
                  />
                </div>
                <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItemForm(false);
                      setItemCategoryId(null);
                      setItemForm({ name: '', price: '', description: '' });
                    }}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm shadow-purple-200"
                  >
                    Crear Item
                  </button>
                </div>
              </form>
            </div>
          )}

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
                <div key={category.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">{category.title}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setItemCategoryId(category.id);
                          setShowItemForm(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Item
                      </button>
                      <details className="relative">
                        <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                          </svg>
                        </summary>
                        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          >
                            Eliminar Categoría
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                  {(category.items?.length ?? 0) === 0 ? (
                    <p className="text-slate-400 text-sm italic">No hay items en esta categoría</p>
                  ) : (
                    <div className="space-y-3">
                      {(category.items ?? []).map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 py-3 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">Gs. {formatPrice(item.price)}</p>
                            <details className="relative">
                              <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                                </svg>
                              </summary>
                              <div className="absolute right-0 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
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
