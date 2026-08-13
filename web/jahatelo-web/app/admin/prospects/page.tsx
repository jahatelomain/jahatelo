'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { Building2, FileText, MoreHorizontal, Search, Trash2, X } from 'lucide-react';

type ProspectStatus = 'NEW' | 'CONTACTED' | 'IN_NEGOTIATION' | 'WON' | 'LOST';
type ProspectChannel = 'WEB' | 'APP' | 'MANUAL';

interface Prospect {
  id: string;
  contactName: string;
  phone: string;
  motelName: string;
  status: ProspectStatus;
  channel: ProspectChannel;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
}

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  IN_NEGOTIATION: 'En Negociación',
  WON: 'Cerrado (Ganado)',
  LOST: 'Cerrado (Perdido)',
};

const STATUS_COLORS: Record<ProspectStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  IN_NEGOTIATION: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-slate-100 text-slate-700',
};

const CHANNEL_LABELS: Record<ProspectChannel, string> = {
  WEB: 'Web',
  APP: 'App',
  MANUAL: 'Manual',
};

const CHANNEL_COLORS: Record<ProspectChannel, string> = {
  WEB: 'bg-blue-100 text-blue-700',
  APP: 'bg-purple-100 text-purple-700',
  MANUAL: 'bg-slate-100 text-slate-700',
};

export default function ProspectsPage() {
  const router = useRouter();
  const toast = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; right: number } | null>(null);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedProspectId, setHighlightedProspectId] = useState<string | null>(null);
  const searchKeyRef = useRef('');
  const pageSize = 20;
  const debouncedSearchQuery = useDebounce(searchQuery, 4000);
  const hasMore = prospects.length < totalItems;
  const canShowSearchSuggestions =
    searchQuery.trim().length >= 3 &&
    searchQuery.trim() === debouncedSearchQuery.trim() &&
    !isSearching;
  const searchSuggestions = prospects.slice(0, 8);

  // Estado para crear prospect manual
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMotelName, setNewMotelName] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const query = debouncedSearchQuery.trim();
    const searchChanged = searchKeyRef.current !== query;
    if (searchChanged) {
      searchKeyRef.current = query;
      setProspects([]);
      setTotalItems(0);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchProspects(!searchChanged && page > 1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, currentUser, debouncedSearchQuery]);

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

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

  const fetchProspects = async (isLoadingMore = false, query = debouncedSearchQuery.trim()) => {
    if (!currentUser) return;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else if (!hasLoadedOnce) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (query) params.set('q', query);
      const response = await fetch(`/api/admin/prospects?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const prospectsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const meta = Array.isArray(data) ? undefined : data?.meta;
        setProspects((prev) => (isLoadingMore ? [...prev, ...prospectsData] : prospectsData));
        setTotalItems(meta?.total ?? prospectsData.length);
      } else {
        if (!isLoadingMore) {
          toast?.showToast('Error al cargar prospects', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
      if (!isLoadingMore) {
        toast?.showToast('Error al cargar prospects', 'error');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
      setHasLoadedOnce(true);
    }
  };

  const handleStatusChange = async (prospectId: string, newStatus: ProspectStatus) => {
    try {
      const response = await fetch(`/api/admin/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast?.showToast('Estado actualizado correctamente', 'success');
        fetchProspects();
      } else {
        toast?.showToast('Error al actualizar estado', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast?.showToast('Error al actualizar estado', 'error');
    }
  };

  const handleOpenNotes = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setNotes(prospect.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedProspect) return;

    try {
      const response = await fetch(`/api/admin/prospects/${selectedProspect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast?.showToast('Notas guardadas correctamente', 'success');
        setShowNotesModal(false);
        fetchProspects();
      } else {
        toast?.showToast('Error al guardar notas', 'error');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast?.showToast('Error al guardar notas', 'error');
    }
  };

  const handleDelete = async (prospectId: string) => {
    setConfirmAction({
      title: 'Eliminar prospect',
      message: '¿Estás seguro de eliminar este prospect? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/prospects/${prospectId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast?.showToast('Prospect eliminado correctamente', 'success');
            fetchProspects();
          } else {
            toast?.showToast('Error al eliminar prospect', 'error');
          }
        } catch (error) {
          console.error('Error deleting prospect:', error);
          toast?.showToast('Error al eliminar prospect', 'error');
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleCreateProspect = async () => {
    // Validación básica
    if (!newContactName.trim() || !newPhone.trim() || !newMotelName.trim()) {
      toast?.showToast('Todos los campos son requeridos', 'error');
      return;
    }

    if (newContactName.trim().length < 2) {
      toast?.showToast('El nombre de contacto debe tener al menos 2 caracteres', 'error');
      return;
    }

    if (newPhone.replace(/\D/g, '').length < 7) {
      toast?.showToast('El teléfono debe tener al menos 7 dígitos', 'error');
      return;
    }

    if (newMotelName.trim().length < 2) {
      toast?.showToast('El nombre del motel debe tener al menos 2 caracteres', 'error');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: newContactName.trim(),
          phone: newPhone.trim(),
          motelName: newMotelName.trim(),
          notes: newNotes.trim() || null,
          channel: 'MANUAL',
        }),
      });

      if (response.ok) {
        toast?.showToast('Prospect creado correctamente', 'success');
        setShowCreateModal(false);
        // Limpiar formulario
        setNewContactName('');
        setNewPhone('');
        setNewMotelName('');
        setNewNotes('');
        fetchProspects();
      } else {
        const data = await response.json();
        toast?.showToast(data.error || 'Error al crear prospect', 'error');
      }
    } catch (error) {
      console.error('Error creating prospect:', error);
      toast?.showToast('Error al crear prospect', 'error');
    } finally {
      setCreating(false);
    }
  };

  const focusProspect = (prospectId: string) => {
    setHighlightedProspectId(prospectId);
    document.getElementById(`prospect-${prospectId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Prospects</h1>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de leads de moteles registrados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{totalItems}</span>
          </div>
          <a
            href="/api/admin/export?type=prospects"
            download
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </a>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 shadow-sm shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Prospect
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setHighlightedProspectId(null);
              }}
              placeholder="Buscar en todos los prospects por motel, contacto, teléfono o notas..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedProspectId(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {canShowSearchSuggestions && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {searchSuggestions.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {searchSuggestions.map((prospect) => (
                      <li key={prospect.id}>
                        <button
                          type="button"
                          onClick={() => focusProspect(prospect.id)}
                          className="block w-full px-4 py-3 text-left transition-colors hover:bg-purple-50"
                        >
                          <p className="text-sm font-semibold text-slate-900">{prospect.motelName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {[prospect.contactName, prospect.phone, STATUS_LABELS[prospect.status]].filter(Boolean).join(' · ')}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500">No encontramos prospects con ese criterio.</p>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isSearching
              ? 'Buscando en todos los prospects...'
              : 'La búsqueda inicia 4 segundos después de la última tecla y consulta todos los prospects registrados.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Motel
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Canal
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {debouncedSearchQuery.trim() ? 'No encontramos prospects con ese criterio' : 'No hay prospects registrados'}
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr id={`prospect-${prospect.id}`} key={prospect.id} className={`transition-colors hover:bg-slate-50 ${highlightedProspectId === prospect.id ? 'bg-purple-50 ring-1 ring-inset ring-purple-200' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {prospect.contactName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{prospect.motelName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{prospect.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CHANNEL_COLORS[prospect.channel]}`}>
                        {CHANNEL_LABELS[prospect.channel]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={prospect.status}
                        onChange={(e) =>
                          handleStatusChange(prospect.id, e.target.value as ProspectStatus)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[prospect.status]
                        } border-0 cursor-pointer focus:ring-2 focus:ring-purple-600`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(prospect.createdAt).toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenNotes(prospect)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                          title="Agregar/Ver notas"
                          aria-label="Agregar o ver notas"
                        >
                          <FileText size={15} />
                        </button>
                        <div>
                          <button
                            onClick={(event) => {
                              if (openMenuId === prospect.id) {
                                setOpenMenuId(null);
                                setActionMenuPosition(null);
                                return;
                              }
                              const bounds = event.currentTarget.getBoundingClientRect();
                              setActionMenuPosition({ top: bounds.bottom + 8, right: window.innerWidth - bounds.right });
                              setOpenMenuId(prospect.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200"
                            title="Más acciones"
                            aria-label="Más acciones"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenuId === prospect.id && actionMenuPosition && typeof document !== 'undefined' && createPortal(
                            <>
                              <div className="fixed inset-0 z-[90]" onClick={() => { setOpenMenuId(null); setActionMenuPosition(null); }} />
                              <div className="fixed z-[100] flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg" style={{ top: actionMenuPosition.top, right: actionMenuPosition.right }}>
                                {prospect.status !== 'WON' && (
                                  <button
                                    onClick={() => { router.push(`/admin/motels/new?prospectId=${prospect.id}`); setOpenMenuId(null); setActionMenuPosition(null); }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-purple-700 hover:bg-purple-50"
                                    title="Dar de alta motel"
                                    aria-label="Dar de alta motel desde prospecto"
                                  >
                                    <Building2 size={15} />
                                  </button>
                                )}
                                <button
                                  onClick={() => { handleDelete(prospect.id); setOpenMenuId(null); setActionMenuPosition(null); }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                                  title="Eliminar prospect"
                                  aria-label="Eliminar prospect"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </>,
                            document.body,
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel y loader */}
        {prospects.length > 0 && (
          <div ref={sentinelRef} className="px-6 pb-6">
            {loadingMore && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Cargando más prospects...</span>
              </div>
            )}
            {!hasMore && totalItems > pageSize && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">
                  Mostrando todos los prospects ({prospects.length} de {totalItems})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Notas: {selectedProspect.motelName}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Agregar notas sobre este prospect..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm shadow-purple-200"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Prospect Modal */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-prospect-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) setShowCreateModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 id="create-prospect-title" className="text-lg font-semibold text-slate-900 mb-4">
              Crear Prospect Manualmente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de contacto *
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={creating}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej: 0981 123 456"
                  disabled={creating}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del motel *
                </label>
                <input
                  type="text"
                  value={newMotelName}
                  onChange={(e) => setNewMotelName(e.target.value)}
                  placeholder="Ej: Motel Paradise"
                  disabled={creating}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Notas adicionales..."
                  disabled={creating}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProspect}
                disabled={creating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-purple-200"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  'Crear Prospect'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
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
