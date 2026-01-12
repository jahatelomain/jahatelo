'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

const placements = [
  { value: 'POPUP_HOME', label: 'Popup Home' },
  { value: 'CAROUSEL', label: 'Carrusel' },
  { value: 'SECTION_BANNER', label: 'Banner de sección' },
  { value: 'LIST_INLINE', label: 'Inline en listado' },
];

export default function NewAdvertisementPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLargeImage, setUploadingLargeImage] = useState(false);
  const [form, setForm] = useState({
    title: '',
    advertiser: '',
    imageUrl: '',
    largeImageUrl: '',
    description: '',
    linkUrl: '',
    placement: 'POPUP_HOME',
    status: 'ACTIVE',
    priority: 0,
    startDate: '',
    endDate: '',
    maxViews: '',
    maxClicks: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLarge: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 10MB');
      return;
    }

    if (isLarge) {
      setUploadingLargeImage(true);
    } else {
      setUploadingImage(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'advertisements');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir imagen');

      const data = await res.json();

      if (isLarge) {
        setForm((prev) => ({ ...prev, largeImageUrl: data.url }));
      } else {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
      }

      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      if (isLarge) {
        setUploadingLargeImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title || !form.advertiser || !form.imageUrl) {
      toast.warning('Completa título, anunciante e imagen');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority),
        maxViews: form.maxViews ? Number(form.maxViews) : null,
        maxClicks: form.maxClicks ? Number(form.maxClicks) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear anuncio');
      }

      toast.success('Anuncio creado');
      router.push('/admin/banners');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear anuncio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Nuevo anuncio</h2>
      <p className="text-slate-500 mb-6">Crea un anuncio para las ubicaciones configuradas.</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Título
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-slate-700">
            Anunciante
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.advertiser}
              onChange={(event) => setForm({ ...form, advertiser: event.target.value })}
              required
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-slate-700 block mb-2">
            Imagen principal <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, false)}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir desde computadora
                  </>
                )}
              </label>
              <span className="text-sm text-slate-500">o</span>
            </div>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://... (pegar URL de imagen)"
            />
            {form.imageUrl && (
              <div className="mt-2">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-700 block mb-2">
            Imagen grande (popup)
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, true)}
                className="hidden"
                id="large-image-upload"
                disabled={uploadingLargeImage}
              />
              <label
                htmlFor="large-image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                  uploadingLargeImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingLargeImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir desde computadora
                  </>
                )}
              </label>
              <span className="text-sm text-slate-500">o</span>
            </div>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.largeImageUrl}
              onChange={(event) => setForm({ ...form, largeImageUrl: event.target.value })}
              placeholder="https://... (pegar URL de imagen)"
            />
            {form.largeImageUrl && (
              <div className="mt-2">
                <img
                  src={form.largeImageUrl}
                  alt="Preview"
                  className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <label className="text-sm text-slate-700">
          Descripción
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={3}
          />
        </label>

        <label className="text-sm text-slate-700">
          Link externo
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.linkUrl}
            onChange={(event) => setForm({ ...form, linkUrl: event.target.value })}
            placeholder="https://..."
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Ubicación
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.placement}
              onChange={(event) => setForm({ ...form, placement: event.target.value })}
            >
              {placements.map((placement) => (
                <option key={placement.value} value={placement.value}>
                  {placement.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Estado
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="ACTIVE">Activo</option>
              <option value="PAUSED">Pausado</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-slate-700">
            Prioridad
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Fecha inicio
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Fecha fin
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Max vistas
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.maxViews}
              onChange={(event) => setForm({ ...form, maxViews: event.target.value })}
            />
          </label>
          <label className="text-sm text-slate-700">
            Max clicks
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.maxClicks}
              onChange={(event) => setForm({ ...form, maxClicks: event.target.value })}
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar anuncio'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/banners')}
            className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
