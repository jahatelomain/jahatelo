/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';

type MotelOption = {
  id: string;
  name: string;
  city: string;
};

type Promo = {
  id: string;
  motelId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  motel?: {
    id: string;
    name: string;
    city: string | null;
  };
};

const initialFormState = {
  id: null as string | null,
  motelId: '',
  title: '',
  description: '',
  imageUrl: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
};

export default function AdminPromosPage() {
  const [motels, setMotels] = useState<MotelOption[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMotel, setFilterMotel] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchMotels();
  }, []);

  useEffect(() => {
    fetchPromos(filterMotel === 'all' ? undefined : filterMotel);
  }, [filterMotel]);

  const fetchMotels = async () => {
    try {
      const res = await fetch('/api/admin/motels');
      if (res.ok) {
        const data = (await res.json()) as MotelOption[];
        setMotels(data);
        if (!form.motelId && data.length > 0) {
          setForm((prev) => ({ ...prev, motelId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching motels', error);
    }
  };

  const fetchPromos = async (motelId?: string) => {
    try {
      setLoading(true);
      const url = motelId ? `/api/admin/promos?motelId=${motelId}` : '/api/admin/promos';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as Promo[];
        setPromos(data);
      }
    } catch (error) {
      console.error('Error fetching promos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/s3', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload error');
      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      console.error('Error uploading image', error);
      alert('No se pudo cargar la imagen.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSavePromo = async () => {
    if (!form.motelId || !form.title.trim()) {
      alert('Seleccioná un motel y escribí un título.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        motelId: form.motelId,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl || null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      };

      const res = await fetch(
        form.id ? `/api/admin/promos/${form.id}` : '/api/admin/promos',
        {
          method: form.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error('Request failed');
      await fetchPromos(filterMotel === 'all' ? undefined : filterMotel);
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving promo', error);
      alert('No se pudo guardar la promo.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPromo = (promo: Promo) => {
    setForm({
      id: promo.id,
      motelId: promo.motelId,
      title: promo.title,
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      validFrom: promo.validFrom ? promo.validFrom.split('T')[0] : '',
      validUntil: promo.validUntil ? promo.validUntil.split('T')[0] : '',
      isActive: promo.isActive,
    });
    setShowForm(true);
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Eliminar esta promo?')) return;
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchPromos(filterMotel === 'all' ? undefined : filterMotel);
    } catch (error) {
      console.error('Error deleting promo', error);
      alert('No se pudo eliminar la promo.');
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...initialFormState,
      motelId: prev.motelId || (motels[0]?.id ?? ''),
    }));
  };

  const filteredPromos = useMemo(() => promos, [promos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Promociones</h1>
          <p className="text-sm text-slate-500">
            Gestioná todas las promos destacadas de los moteles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filterMotel}
            onChange={(e) => setFilterMotel(e.target.value)}
          >
            <option value="all">Todos los moteles</option>
            {motels.map((motel) => (
              <option key={motel.id} value={motel.id}>
                {motel.name} · {motel.city}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva promo
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {form.id ? 'Editar promo' : 'Crear promo'}
            </h2>
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="text-slate-500 hover:text-slate-800 text-sm"
            >
              Cancelar
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Motel *</label>
              <select
                name="motelId"
                value={form.motelId}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccioná un motel...</option>
                {motels.map((motel) => (
                  <option key={motel.id} value={motel.id}>
                    {motel.name} · {motel.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ej: 2x1 en habitaciones VIP"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Detalles adicionales de la promoción..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Imagen</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://..."
                />
                <label className={`inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadImage}
                    disabled={uploading}
                  />
                  <span className="px-3 py-1.5 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                    {uploading ? 'Subiendo imagen...' : 'Subir archivo'}
                  </span>
                </label>
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border border-slate-200"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
                <input
                  type="date"
                  name="validFrom"
                  value={form.validFrom}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
                <input
                  type="date"
                  name="validUntil"
                  value={form.validUntil}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  className="rounded border-slate-300"
                />
                Activa
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSavePromo}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-70"
            >
              {saving ? 'Guardando...' : 'Guardar promo'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Listado ({filteredPromos.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Cargando promociones...</div>
        ) : filteredPromos.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No hay promociones registradas {filterMotel !== 'all' && 'para este motel'}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Promo</th>
                  <th className="px-6 py-3">Motel</th>
                  <th className="px-6 py-3">Vigencia</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{promo.title}</p>
                      {promo.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{promo.motel?.name}</div>
                      <div className="text-xs text-slate-500">{promo.motel?.city}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {(promo.validFrom
                        ? new Date(promo.validFrom).toLocaleDateString('es-AR')
                        : 'No definido')}{' '}
                      –{' '}
                      {(promo.validUntil
                        ? new Date(promo.validUntil).toLocaleDateString('es-AR')
                        : 'Indefinido')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          promo.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {promo.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditPromo(promo)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
