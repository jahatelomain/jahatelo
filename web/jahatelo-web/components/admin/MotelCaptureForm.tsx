'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  getAllDrafts,
  hasDrafts,
  type MotelDraft
} from '@/lib/utils/offline-storage';
import { extractCoordinatesFromGoogleMapsUrl, formatCoordinates } from '@/lib/utils/coordinates';

interface MotelCaptureFormProps {
  onSuccess?: (motelId: string) => void;
}

export default function MotelCaptureForm({ onSuccess }: MotelCaptureFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showDraftsList, setShowDraftsList] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<MotelDraft[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<MotelDraft>({
    defaultValues: {
      rooms: [{ name: '', pricePerHour: '', additionalPrice: '', description: '', amenities: [], otherAmenity: '' }],
      promos: [],
      plan: 'BASIC',
      paymentMethod: 'transfer',
      paymentFrequency: 'monthly',
      is24Hours: false,
    },
  });

  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({
    control,
    name: 'rooms',
  });

  const { fields: promoFields, append: appendPromo, remove: removePromo } = useFieldArray({
    control,
    name: 'promos',
  });

  const googleMapsUrl = watch('googleMapsUrl');

  // Auto-save draft cada 30 segundos (guarda o actualiza el borrador actual)
  useEffect(() => {
    const interval = setInterval(() => {
      const formData = watch();
      // Si ya hay un draft ID, actualizar ese draft, si no, crear nuevo
      const draftId = saveDraft(formData as Partial<MotelDraft>, currentDraftId || undefined);
      if (!currentDraftId) {
        setCurrentDraftId(draftId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [watch, currentDraftId]);

  // Cargar lista de borradores disponibles al montar componente
  useEffect(() => {
    const drafts = getAllDrafts();
    setAvailableDrafts(drafts);
    if (drafts.length > 0) {
      setShowDraftsList(true);
    }
  }, []);

  // Auto-extraer coordenadas cuando cambia Google Maps URL
  useEffect(() => {
    if (googleMapsUrl && googleMapsUrl.length > 10) {
      const coords = extractCoordinatesFromGoogleMapsUrl(googleMapsUrl);
      setExtractedCoords(coords);
    } else {
      setExtractedCoords(null);
    }
  }, [googleMapsUrl]);

  const restoreDraft = (draftId: string) => {
    const draft = loadDraft(draftId);
    if (draft) {
      Object.keys(draft).forEach((key) => {
        if (key !== 'id' && key !== 'savedAt') {
          setValue(key as any, draft[key as keyof typeof draft] as any);
        }
      });
      setCurrentDraftId(draftId);
      setShowDraftsList(false);
    }
  };

  const removeDraft = (draftId: string) => {
    const success = deleteDraft(draftId);
    if (success) {
      const updatedDrafts = getAllDrafts();
      setAvailableDrafts(updatedDrafts);
      if (updatedDrafts.length === 0) {
        setShowDraftsList(false);
      }
      // Si eliminamos el draft que estamos editando, limpiar el ID
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
    }
  };

  const startNewDraft = () => {
    setCurrentDraftId(null);
    setShowDraftsList(false);
  };

  const onSubmit = async (data: MotelDraft) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/motels/from-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear motel');
      }

      const result = await response.json();

      // Limpiar borrador actual (si existe)
      if (currentDraftId) {
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }

      // Redirigir al perfil del motel creado
      if (onSuccess) {
        onSuccess(result.motel.id);
      } else {
        router.push(`/admin/motels/${result.motel.slug}`);
      }

      alert(result.message);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al crear motel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraftManually = () => {
    const formData = watch();
    const draftId = saveDraft(formData as Partial<MotelDraft>, currentDraftId || undefined);
    if (!currentDraftId) {
      setCurrentDraftId(draftId);
    }
    alert('Borrador guardado exitosamente');
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {showDraftsList && availableDrafts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-blue-800 font-semibold">Tienes {availableDrafts.length} borrador{availableDrafts.length > 1 ? 'es' : ''} guardado{availableDrafts.length > 1 ? 's' : ''}</p>
            <button
              type="button"
              onClick={startNewDraft}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              + Nuevo borrador
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableDrafts.map((draft) => (
              <div key={draft.id} className="bg-white border border-blue-200 rounded p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{draft.name || 'Sin nombre'}</p>
                  <p className="text-xs text-gray-500">
                    Guardado: {new Date(draft.savedAt).toLocaleString('es-PY', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {draft.city || 'Sin ciudad'} • {draft.rooms?.length || 0} habitación{draft.rooms?.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => restoreDraft(draft.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Cargar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentDraftId && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-yellow-800 text-sm">
            📝 Editando borrador guardado • Los cambios se guardan automáticamente cada 30 segundos
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* SECCIÓN 1: DATOS BÁSICOS */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">1. Datos Básicos del Motel</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del motel *</label>
              <input
                {...register('name', { required: 'Campo requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Motel Romance"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del contacto *</label>
              <input
                {...register('contactName', { required: 'Campo requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo</label>
              <input
                {...register('contactPosition')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Gerente"
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">2. Información de Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono fijo *</label>
              <input
                {...register('phone', { required: 'Campo requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="+595 21 XXX XXX"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp</label>
              <input
                {...register('whatsapp')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="+595 9XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Instagram</label>
              <input
                {...register('instagram')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="@usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook</label>
              <input
                {...register('facebook')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: UBICACIÓN */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">3. Ubicación</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección completa *</label>
              <input
                {...register('address', { required: 'Campo requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad *</label>
                <input
                  {...register('city', { required: 'Campo requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Asunción"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Barrio/Zona</label>
                <input
                  {...register('neighborhood')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Referencia</label>
              <input
                {...register('reference')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="Cerca de..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Link Google Maps *</label>
              <input
                {...register('googleMapsUrl', { required: 'Campo requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                placeholder="https://maps.google.com/..."
              />
              {errors.googleMapsUrl && <p className="text-red-500 text-xs mt-1">{errors.googleMapsUrl.message}</p>}
              {extractedCoords && (
                <p className="text-green-600 text-sm mt-1">
                  ✓ Coordenadas extraídas: {formatCoordinates(extractedCoords.lat, extractedCoords.lng)}
                </p>
              )}
              {googleMapsUrl && !extractedCoords && googleMapsUrl.length > 10 && (
                <p className="text-red-500 text-sm mt-1">
                  ⚠ No se pudieron extraer coordenadas del link
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: OPERACIÓN */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">4. Operación</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lunes a Viernes</label>
                <input
                  {...register('scheduleWeekdays')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: 10:00 - 22:00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sábados</label>
                <input
                  {...register('scheduleSaturday')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Domingos/Feriados</label>
                <input
                  {...register('scheduleSunday')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is24Hours')}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-gray-700">¿Atienden 24/7?</label>
            </div>

          </div>
        </section>

        {/* SECCIÓN 4: DESCRIPCIÓN */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">4. Descripción del Motel</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción breve (2-3 líneas) *</label>
            <textarea
              {...register('description', { required: 'Campo requerido', minLength: { value: 10, message: 'Mínimo 10 caracteres' } })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              placeholder="Describe tu motel brevemente..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
        </section>

        {/* SECCIÓN 5: HABITACIONES */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">5. Habitaciones *</h2>

          {roomFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Habitación {index + 1}</h3>
                {roomFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre/Tipo *</label>
                  <input
                    {...register(`rooms.${index}.name` as const, { required: 'Campo requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Suite Ejecutiva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio por hora/turno *</label>
                  <input
                    {...register(`rooms.${index}.pricePerHour` as const, { required: 'Campo requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="Gs. 50.000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción breve</label>
                  <textarea
                    {...register(`rooms.${index}.description` as const)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['TV por cable', 'Aire acondicionado', 'Jacuzzi', 'WiFi', 'Frigobar', 'Cama king/queen'].map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={amenity}
                          {...register(`rooms.${index}.amenities` as const)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => appendRoom({ name: '', pricePerHour: '', additionalPrice: '', description: '', amenities: [], otherAmenity: '' })}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            + Agregar otra habitación
          </button>
        </section>

        {/* SECCIÓN 6: PROMOCIONES */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">6. Promociones</h2>

          {promoFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Promoción {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removePromo(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
                  <input
                    {...register(`promos.${index}.title` as const, { required: 'Campo requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: 2x1 en habitaciones"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descuento (%)</label>
                  <input
                    {...register(`promos.${index}.discount` as const)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción *</label>
                  <textarea
                    {...register(`promos.${index}.description` as const, { required: 'Campo requerido' })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Válida hasta</label>
                  <input
                    type="date"
                    {...register(`promos.${index}.validUntil` as const)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Días aplicables</label>
                  <input
                    {...register(`promos.${index}.applicableDays` as const)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="Lunes a Jueves"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => appendPromo({ title: '', description: '', discount: '', validUntil: '', applicableDays: '' })}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            + Agregar promoción
          </button>
        </section>

        {/* SECCIÓN 7: PLAN ELEGIDO */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">7. Plan Elegido *</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="BASIC"
                {...register('plan', { required: true })}
                className="mt-1 w-5 h-5"
              />
              <div>
                <p className="font-bold text-lg">PLAN BÁSICO - Gs. 330.000/mes</p>
                <p className="text-sm text-gray-600">1 foto por habitación • 1 promoción activa</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 border-yellow-500 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100">
              <input
                type="radio"
                value="GOLD"
                {...register('plan', { required: true })}
                className="mt-1 w-5 h-5"
              />
              <div>
                <p className="font-bold text-lg">PLAN GOLD ⭐ - Gs. 660.000/mes <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">RECOMENDADO</span></p>
                <p className="text-sm text-gray-600">3 fotos por habitación • 5 promociones • Badge dorado • +15% visibilidad</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 border-cyan-500 bg-cyan-50 rounded-lg cursor-pointer hover:bg-cyan-100">
              <input
                type="radio"
                value="DIAMOND"
                {...register('plan', { required: true })}
                className="mt-1 w-5 h-5"
              />
              <div>
                <p className="font-bold text-lg">PLAN DIAMOND 💎 - Gs. 1.100.000/mes</p>
                <p className="text-sm text-gray-600">Fotos ilimitadas • Promociones ilimitadas • +30% visibilidad • Soporte 24/7</p>
              </div>
            </label>
          </div>
        </section>

        {/* SECCIÓN 8: FORMA DE PAGO */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">8. Forma de Pago *</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Método de pago</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="transfer"
                    {...register('paymentMethod', { required: true })}
                    className="w-4 h-4"
                  />
                  <span>Transferencia bancaria</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="card"
                    {...register('paymentMethod', { required: true })}
                    className="w-4 h-4"
                  />
                  <span>Tarjeta de débito/crédito</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Frecuencia</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="monthly"
                    {...register('paymentFrequency', { required: true })}
                    className="w-4 h-4"
                  />
                  <span>Mensual adelantado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="quarterly"
                    {...register('paymentFrequency', { required: true })}
                    className="w-4 h-4"
                  />
                  <span>Trimestral (con descuento)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">RUC/CI</label>
                <input
                  {...register('ruc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Razón social</label>
                <input
                  {...register('businessName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección fiscal</label>
                <input
                  {...register('fiscalAddress')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4 justify-end bg-white p-6 rounded-lg shadow sticky bottom-4">
          <button
            type="button"
            onClick={saveDraftManually}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
          >
            💾 Guardar Borrador
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando motel...' : '✓ Crear Motel'}
          </button>
        </div>
      </form>
    </div>
  );
}
