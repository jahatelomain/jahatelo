'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { AMENITY_ICONS, ICON_CATEGORIES } from '@/lib/amenityIcons';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import DirtyBanner from '@/components/admin/DirtyBanner';
import PaginationControls from '../components/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';

type Amenity = {
  id: string;
  name: string;
  type: string | null;
  icon: string | null;
  _count: {
    roomAmenities: number;
    motelAmenities: number;
  };
  motelAmenities?: {
    motel: {
      id: string;
      name: string;
      city: string;
    };
  }[];
};

type ConfirmAction = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  danger?: boolean;
} | null;

export default function AmenitiesPage() {
  const toast = useToast();
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: '', icon: '' });
  const [expandedAmenity, setExpandedAmenity] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const fetchAmenities = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
      const res = await fetch(`/api/admin/amenities?${params.toString()}`);
      const data = await res.json();

      const amenitiesData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      const meta = Array.isArray(data) ? undefined : data?.meta;
      setAmenities(amenitiesData);
      setTotalItems(meta?.total ?? amenitiesData.length);
      setExpandedAmenity(null);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenities([]);
      toast.error('Error al cargar amenities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextKey = `${typeFilter}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchAmenities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, debouncedSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId
      ? `/api/admin/amenities/${editingId}`
      : '/api/admin/amenities';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Amenity actualizado exitosamente' : 'Amenity creado exitosamente');
        fetchAmenities();
        handleCancel();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar amenity');
      }
    } catch (error) {
      console.error('Error saving amenity:', error);
      toast.error('Error al guardar amenity');
    }
  };

  const handleEdit = (amenity: Amenity) => {
    setEditingId(amenity.id);
    setFormData({ name: amenity.name, type: amenity.type || '', icon: amenity.icon || '' });
    setShowForm(true);
    setFormDirty(false);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmAction({
      title: 'Eliminar Amenity',
      message: `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/amenities/${id}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            toast.success('Amenity eliminado exitosamente');
            fetchAmenities();
          } else {
            const error = await res.json();
            toast.error(error.error || 'Error al eliminar amenity');
          }
        } catch (error) {
          console.error('Error deleting amenity:', error);
          toast.error('Error al eliminar amenity');
        }
        setConfirmAction(null);
      },
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: '', icon: '' });
    setFormDirty(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedAmenity((prev) => (prev === id ? null : id));
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return null;
    const labels: Record<string, string> = {
      'ROOM': 'Habitación',
      'MOTEL': 'Motel',
      'BOTH': 'Ambos',
    };
    return labels[type] || type;
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-32" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-64" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 bg-slate-50 rounded animate-pulse flex-1" />
            </div>
          </div>
        </div>
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  if (!Array.isArray(amenities)) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: No se pudieron cargar los amenities correctamente
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Amenities</h1>
          <p className="text-sm text-slate-600 mt-1">Gestioná los amenities disponibles para moteles y habitaciones</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Amenity
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Editar Amenity' : 'Nuevo Amenity'}
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFormDirty(true);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Ej: WiFi, Aire acondicionado"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo <span className="text-slate-400">(opcional)</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value });
                    setFormDirty(true);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                >
                  <option value="">Sin especificar</option>
                  <option value="ROOM">Habitación</option>
                  <option value="MOTEL">Motel</option>
                  <option value="BOTH">Ambos</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Ícono <span className="text-slate-400">(opcional)</span>
                </label>
                {formData.icon && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, icon: '' });
                      setFormDirty(true);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Quitar selección
                  </button>
                )}
              </div>
              <div className="space-y-4 border border-slate-200 rounded-xl p-4 max-h-80 overflow-y-auto bg-slate-50">
                {Object.entries(ICON_CATEGORIES).map(([category, label]) => (
                  <div key={category} className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                    <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
                      {AMENITY_ICONS.filter((icon) => icon.category === category).map((icon) => {
                        const IconComponent = iconLibrary[icon.value];
                        if (!IconComponent) return null;
                        const isSelected = formData.icon === icon.value;
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, icon: icon.value });
                              setFormDirty(true);
                            }}
                            className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600'
                            }`}
                            title={icon.label}
                          >
                        <IconComponent size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Barra de búsqueda */}
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
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

        {/* Filtros tipo pill */}
        <div className="space-y-3">
          {/* Tipo */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-300'
                }`}
              >
                Todos <span className="ml-1 opacity-75">({amenities.length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('ROOM')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === 'ROOM'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-300'
                }`}
              >
                Habitación <span className="ml-1 opacity-75">({amenities.filter((a) => a.type === 'ROOM').length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('MOTEL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === 'MOTEL'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Motel <span className="ml-1 opacity-75">({amenities.filter((a) => a.type === 'MOTEL').length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('BOTH')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === 'BOTH'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-amber-300'
                }`}
              >
                Ambos <span className="ml-1 opacity-75">({amenities.filter((a) => a.type === 'BOTH').length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('NULL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  typeFilter === 'NULL'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Sin especificar <span className="ml-1 opacity-75">({amenities.filter((a) => !a.type).length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{amenities.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> amenities
          </p>
          {(searchQuery || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ícono
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Uso
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {amenities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl text-slate-300">✨</span>
                    <p className="text-slate-500 font-medium">
                      {searchQuery || typeFilter !== 'ALL'
                        ? 'No se encontraron amenities con estos filtros'
                        : 'No hay amenities registrados'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {searchQuery || typeFilter !== 'ALL'
                        ? 'Intentá con otros criterios de búsqueda'
                        : 'Creá el primero usando el botón de arriba'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              amenities.map((amenity) => {
                const motelCount = amenity._count.motelAmenities;
                const roomCount = amenity._count.roomAmenities;
                const motels = amenity.motelAmenities ?? [];

                return (
                  <Fragment key={amenity.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{amenity.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {amenity.icon ? (
                          <div className="inline-flex items-center gap-2 text-slate-600">
                            {(() => {
                              const IconComponent = iconLibrary[amenity.icon];
                              if (!IconComponent) return null;
                              return <IconComponent size={18} />;
                            })()}
                            <span className="text-xs font-medium">
                              {AMENITY_ICONS.find((icon) => icon.value === amenity.icon)?.label || amenity.icon}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Sin ícono</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {amenity.type ? (
                          <span className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
                            {getTypeLabel(amenity.type)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Sin especificar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => (motelCount > 0 ? toggleExpanded(amenity.id) : undefined)}
                            className={`inline-flex items-center gap-1.5 ${
                              motelCount > 0 ? 'text-purple-600 hover:text-purple-700 cursor-pointer' : 'text-slate-500 cursor-default'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {motelCount} {motelCount === 1 ? 'motel' : 'moteles'}
                          </button>
                          <span className="inline-flex items-center gap-1.5 text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                            </svg>
                            {roomCount} {roomCount === 1 ? 'habitación' : 'habitaciones'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(amenity)}
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
                            <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                              <button
                                onClick={() => handleDelete(amenity.id, amenity.name)}
                                className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                    {expandedAmenity === amenity.id && motels.length > 0 && (
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Moteles que utilizan este amenity
                          </div>
                          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-700">
                            {motels.map(({ motel }) => (
                              <li key={motel.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                <span className="text-purple-600">🏨</span>
                                <div>
                                  <p className="font-medium text-slate-900">{motel.name}</p>
                                  <p className="text-xs text-slate-500">{motel.city}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
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
