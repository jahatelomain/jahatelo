'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');

  // Estado para crear prospect manual
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMotelName, setNewMotelName] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    checkAccess();
    fetchProspects();
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

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/prospects');
      if (response.ok) {
        const data = await response.json();
        setProspects(data);
      } else {
        toast?.showToast('Error al cargar prospects', 'error');
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast?.showToast('Error al cargar prospects', 'error');
    } finally {
      setLoading(false);
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
    if (!confirm('¿Estás seguro de eliminar este prospect?')) return;

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
    }
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
            Total: <span className="font-semibold text-slate-900">{prospects.length}</span>
          </div>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    No hay prospects registrados
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-slate-50">
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
                          className="inline-flex items-center rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                          title="Agregar/Ver notas"
                        >
                          Notas
                        </button>
                        <details className="relative">
                          <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm-10 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                          </summary>
                          <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                            <button
                              onClick={() => handleDelete(prospect.id)}
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
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
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
        </div>
      )}
    </div>
  );
}
