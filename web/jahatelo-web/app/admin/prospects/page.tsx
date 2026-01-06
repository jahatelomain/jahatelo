'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

type ProspectStatus = 'NEW' | 'CONTACTED' | 'IN_NEGOTIATION' | 'WON' | 'LOST';

interface Prospect {
  id: string;
  contactName: string;
  phone: string;
  motelName: string;
  status: ProspectStatus;
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
  LOST: 'bg-gray-100 text-gray-800',
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

  if (loading || !currentUser) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Prospects</h1>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de leads de moteles registrados
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{prospects.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay prospects registrados
                  </td>
                </tr>
              ) : (
                prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prospect.contactName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prospect.motelName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{prospect.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={prospect.status}
                        onChange={(e) =>
                          handleStatusChange(prospect.id, e.target.value as ProspectStatus)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[prospect.status]
                        } border-0 cursor-pointer focus:ring-2 focus:ring-purple-500`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(prospect.createdAt).toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenNotes(prospect)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          title="Agregar/Ver notas"
                        >
                          Notas
                        </button>
                        <button
                          onClick={() => handleDelete(prospect.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Notas: {selectedProspect.motelName}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Agregar notas sobre este prospect..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
