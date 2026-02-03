'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import DirtyBanner from '@/components/admin/DirtyBanner';

const placements = [
  { value: 'POPUP_HOME', label: 'Popup Home' },
  { value: 'CAROUSEL', label: 'Carrusel' },
  { value: 'LIST_INLINE', label: 'Inline en listado' },
];

export default function EditAdvertisementPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPopupImage, setUploadingPopupImage] = useState(false);
  const [uploadingPopupWeb, setUploadingPopupWeb] = useState(false);
  const [uploadingPopupApp, setUploadingPopupApp] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const formSnapshotRef = useRef('');
  const [form, setForm] = useState({
    title: '',
    advertiser: '',
    imageUrl: '',
    largeImageUrl: '',
    largeImageUrlWeb: '',
    largeImageUrlApp: '',
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

  useEffect(() => {
    if (!id) return;
    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/admin/banners/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al cargar anuncio');
        const data = await res.json();
        const nextForm = {
          title: data.title || '',
          advertiser: data.advertiser || '',
          imageUrl: data.imageUrl || '',
          largeImageUrl: data.largeImageUrl || '',
          largeImageUrlWeb: data.largeImageUrlWeb || '',
          largeImageUrlApp: data.largeImageUrlApp || '',
          description: data.description || '',
          linkUrl: data.linkUrl || '',
          placement: data.placement || 'POPUP_HOME',
          status: data.status || 'ACTIVE',
          priority: data.priority || 0,
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : '',
          maxViews: data.maxViews !== null ? String(data.maxViews) : '',
          maxClicks: data.maxClicks !== null ? String(data.maxClicks) : '',
        };
        setForm(nextForm);
        formSnapshotRef.current = JSON.stringify(nextForm);
        setFormDirty(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar anuncio');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id, toast]);

  useEffect(() => {
    const snapshot = formSnapshotRef.current;
    if (!snapshot) return;
    setFormDirty(JSON.stringify(form) !== snapshot);
  }, [form]);

  const loadImageFromFile = (file: File) =>
    new Promise<{ image: HTMLImageElement; revoke: () => void }>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({ image, revoke: () => URL.revokeObjectURL(url) });
      image.onerror = (event) => {
        URL.revokeObjectURL(url);
        reject(event);
      };
      image.src = url;
    });

  const cropImageToRatio = (
    image: HTMLImageElement,
    ratio: number,
    outputType = 'image/jpeg'
  ) =>
    new Promise<Blob>((resolve, reject) => {
      const sourceWidth = image.naturalWidth || image.width;
      const sourceHeight = image.naturalHeight || image.height;
      if (!sourceWidth || !sourceHeight) {
        reject(new Error('La imagen no tiene dimensiones válidas.'));
        return;
      }

      const sourceRatio = sourceWidth / sourceHeight;
      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      let cropX = 0;
      let cropY = 0;

      if (sourceRatio > ratio) {
        cropWidth = Math.round(sourceHeight * ratio);
        cropX = Math.round((sourceWidth - cropWidth) / 2);
      } else if (sourceRatio < ratio) {
        cropHeight = Math.round(sourceWidth / ratio);
        cropY = Math.round((sourceHeight - cropHeight) / 2);
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el canvas.'));
        return;
      }

      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo procesar la imagen.'));
            return;
          }
          resolve(blob);
        },
        outputType,
        0.9
      );
    });

  const createCroppedFile = async (file: File, ratio: number, suffix: string) => {
    const { image, revoke } = await loadImageFromFile(file);
    try {
      const blob = await cropImageToRatio(image, ratio);
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const fileName = `${baseName}-${suffix}.jpg`;
      return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    } finally {
      revoke();
    }
  };

  const uploadFileToS3 = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'advertisements');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let message = 'Error al subir imagen';
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 10MB');
      return;
    }

    setUploadingImage(true);

    try {
      const url = await uploadFileToS3(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));

      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePopupFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 10MB');
      return;
    }

    setUploadingPopupImage(true);
    try {
      const [webFile, appFile] = await Promise.all([
        createCroppedFile(file, 16 / 9, 'web'),
        createCroppedFile(file, 4 / 5, 'app'),
      ]);
      const [webUrl, appUrl] = await Promise.all([
        uploadFileToS3(webFile),
        uploadFileToS3(appFile),
      ]);
      setForm((prev) => ({
        ...prev,
        largeImageUrlWeb: webUrl,
        largeImageUrlApp: appUrl,
        largeImageUrl: prev.largeImageUrl || webUrl,
      }));
      toast.success('Imagen de popup procesada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploadingPopupImage(false);
      event.target.value = '';
    }
  };

  const handlePopupVariantFileChange = async (
    variant: 'web' | 'app',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 10MB');
      return;
    }

    const setUploading = variant === 'web' ? setUploadingPopupWeb : setUploadingPopupApp;
    setUploading(true);
    try {
      const targetRatio = variant === 'web' ? 16 / 9 : 4 / 5;
      const croppedFile = await createCroppedFile(file, targetRatio, variant);
      const url = await uploadFileToS3(croppedFile);
      setForm((prev) => ({
        ...prev,
        largeImageUrlWeb: variant === 'web' ? url : prev.largeImageUrlWeb,
        largeImageUrlApp: variant === 'app' ? url : prev.largeImageUrlApp,
        largeImageUrl: prev.largeImageUrl || url,
      }));
      toast.success('Imagen actualizada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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

      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar anuncio');
      }

      toast.success('Anuncio actualizado');
      router.push('/admin/banners');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar anuncio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Editar anuncio</h1>
        <p className="text-sm text-slate-600 mt-1">Actualiza la información del anuncio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <DirtyBanner visible={formDirty} />
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
          <label className="text-sm text-slate-700 block mb-2">Imagen grande (popup)</label>
          <p className="text-xs text-slate-500 mb-3">
            Se generan versiones para Web (16:9) y App (4:5). Puedes reemplazarlas manualmente si lo necesitas.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handlePopupFileChange}
                className="hidden"
                id="popup-image-upload"
                disabled={uploadingPopupImage}
              />
              <label
                htmlFor="popup-image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                  uploadingPopupImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingPopupImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir imagen base
                  </>
                )}
              </label>
              <span className="text-sm text-slate-500">Genera ambas versiones automáticamente</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Versión web (16:9)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handlePopupVariantFileChange('web', event)}
                    className="hidden"
                    id="popup-web-upload"
                    disabled={uploadingPopupWeb}
                  />
                  <label
                    htmlFor="popup-web-upload"
                    className={`text-xs px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 ${
                      uploadingPopupWeb ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingPopupWeb ? 'Subiendo...' : 'Reemplazar'}
                  </label>
                </div>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.largeImageUrlWeb}
                  onChange={(event) => setForm({ ...form, largeImageUrlWeb: event.target.value })}
                  placeholder="https://... (URL web 16:9)"
                />
                {(form.largeImageUrlWeb || form.largeImageUrl) && (
                  <img
                    src={form.largeImageUrlWeb || form.largeImageUrl}
                    alt="Preview web"
                    className="w-full aspect-[16/9] rounded-lg border border-slate-200 object-cover"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Versión app (4:5)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handlePopupVariantFileChange('app', event)}
                    className="hidden"
                    id="popup-app-upload"
                    disabled={uploadingPopupApp}
                  />
                  <label
                    htmlFor="popup-app-upload"
                    className={`text-xs px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 ${
                      uploadingPopupApp ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingPopupApp ? 'Subiendo...' : 'Reemplazar'}
                  </label>
                </div>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.largeImageUrlApp}
                  onChange={(event) => setForm({ ...form, largeImageUrlApp: event.target.value })}
                  placeholder="https://... (URL app 4:5)"
                />
                {(form.largeImageUrlApp || form.largeImageUrl) && (
                  <img
                    src={form.largeImageUrlApp || form.largeImageUrl}
                    alt="Preview app"
                    className="w-full aspect-[4/5] rounded-lg border border-slate-200 object-cover"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">URL fallback (legacy)</label>
              <input
                type="url"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 mt-1"
                value={form.largeImageUrl}
                onChange={(event) => setForm({ ...form, largeImageUrl: event.target.value })}
                placeholder="https://... (se usa si faltan variantes)"
              />
            </div>
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

        <div className="sticky bottom-0 bg-white/95 backdrop-blur -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 pb-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push('/admin/banners')}
            className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60 shadow-sm shadow-purple-200"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
