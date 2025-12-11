'use client';

import { Fragment, useEffect, useState } from 'react';

type Amenity = {
  id: string;
  name: string;
  type: string | null;
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

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: '' });
  const [expandedAmenity, setExpandedAmenity] = useState<string | null>(null);

  const fetchAmenities = async () => {
    try {
      const res = await fetch('/api/admin/amenities');
      const data = await res.json();

      // Validar que la respuesta sea un array
      if (Array.isArray(data)) {
        setAmenities(data);
        setExpandedAmenity(null);
      } else {
        console.error('API response is not an array:', data);
        setAmenities([]);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

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
        fetchAmenities();
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', type: '' });
      } else {
        const error = await res.json();
        alert(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving amenity:', error);
      alert('Error al guardar amenity');
    }
  };

  const handleEdit = (amenity: Amenity) => {
    setEditingId(amenity.id);
    setFormData({ name: amenity.name, type: amenity.type || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este amenity?')) return;

    try {
      const res = await fetch(`/api/admin/amenities/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAmenities();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting amenity:', error);
      alert('Error al eliminar amenity');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: '' });
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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  // Validación de seguridad adicional
  if (!Array.isArray(amenities)) {
    console.error('Amenities is not an array:', amenities);
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

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Sin especificar</option>
                <option value="ROOM">Habitación</option>
                <option value="MOTEL">Motel</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 bg-slate-100 text-slate-700 py-2.5 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Nombre
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
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl text-slate-300">✨</span>
                    <p className="text-slate-500 font-medium">No hay amenities registrados</p>
                    <p className="text-sm text-slate-400">Creá el primero usando el botón de arriba</p>
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
                              motelCount > 0 ? 'text-purple-600 hover:text-purple-700' : 'text-slate-500'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => handleEdit(amenity)}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(amenity.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                    {expandedAmenity === amenity.id && motels.length > 0 && (
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Moteles que utilizan este amenity
                          </div>
                          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-700">
                            {motels.map(({ motel }) => (
                              <li key={motel.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                <span className="text-purple-500">🏨</span>
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
    </div>
  );
}
