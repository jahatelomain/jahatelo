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

      const res = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear anuncio');
      }

      toast.success('Anuncio creado');
      router.push('/admin/advertisements');
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

        <label className="text-sm text-slate-700">
          Imagen principal
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.imageUrl}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            placeholder="https://..."
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          Imagen grande (popup)
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={form.largeImageUrl}
            onChange={(event) => setForm({ ...form, largeImageUrl: event.target.value })}
            placeholder="https://..."
          />
        </label>

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
            onClick={() => router.push('/admin/advertisements')}
            className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
