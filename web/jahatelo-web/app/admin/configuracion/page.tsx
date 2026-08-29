'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import AccessProfilesPanel from '@/components/admin/AccessProfilesPanel';
import LocationCatalogPanel from '@/components/admin/LocationCatalogPanel';
import { AdminPageHeader } from '@/components/admin/AdminUi';

type TabId = 'varios' | 'perfiles' | 'ubicaciones';

export default function ConfiguracionPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('varios');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ageGateEnabled, setAgeGateEnabled] = useState(false);
  const [appMinimumVersion, setAppMinimumVersion] = useState('1.0.0');
  const [appRecommendedVersion, setAppRecommendedVersion] = useState('1.0.0');
  const [appUpdateMessage, setAppUpdateMessage] = useState('Actualizá Jahatelo para disfrutar mejoras y correcciones.');
  const [iosStoreUrl, setIosStoreUrl] = useState('');
  const [androidStoreUrl, setAndroidStoreUrl] = useState('https://play.google.com/store/apps/details?id=app.jahatelo.mobile');

  const checkAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.user || data.user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return;
      }
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
    }
  }, [router]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        // Cargar el valor de age_gate_enabled
        const ageGateValue = data.settings?.age_gate_enabled?.value;
        setAgeGateEnabled(ageGateValue === 'true');
        setAppMinimumVersion(data.settings?.app_minimum_version?.value || '1.0.0');
        setAppRecommendedVersion(data.settings?.app_recommended_version?.value || '1.0.0');
        setAppUpdateMessage(data.settings?.app_update_message?.value || 'Actualizá Jahatelo para disfrutar mejoras y correcciones.');
        setIosStoreUrl(data.settings?.app_ios_store_url?.value || '');
        setAndroidStoreUrl(data.settings?.app_android_store_url?.value || 'https://play.google.com/store/apps/details?id=app.jahatelo.mobile');
      } else {
        toast.error('Error al cargar configuraciones');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void checkAccess();
    void fetchSettings();
  }, [checkAccess, fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age_gate_enabled: ageGateEnabled,
          app_minimum_version: appMinimumVersion.trim(),
          app_recommended_version: appRecommendedVersion.trim(),
          app_update_message: appUpdateMessage.trim(),
          app_ios_store_url: iosStoreUrl.trim(),
          app_android_store_url: androidStoreUrl.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        await fetchSettings(); // Recargar configuraciones
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader title="Ajustes Generales" description="Configura opciones generales de la plataforma" />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('varios')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'varios'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Varios
          </button>
          <button
            onClick={() => setActiveTab('perfiles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'perfiles'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Perfiles de acceso
          </button>
          <button onClick={() => setActiveTab('ubicaciones')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ubicaciones' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Países y ciudades</button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'varios' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Configuraciones Varias
          </h2>

          <div className="space-y-6">
            {/* Age Gate Toggle */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-base font-medium text-slate-900 mb-1">
                  Solicitar permiso de mayoría de edad
                </h3>
                <p className="text-sm text-slate-600">
                  Muestra un popup al inicio pidiendo confirmación de que el usuario es mayor de 18 años.
                  Aplica para la aplicación móvil y la web pública.
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  {ageGateEnabled ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Activo - Los usuarios verán el popup de edad
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Inactivo - No se muestra el popup
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => setAgeGateEnabled(!ageGateEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                    ageGateEnabled ? 'bg-purple-600' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={ageGateEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      ageGateEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Agregar más configuraciones aquí en el futuro */}
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900">Actualización de las apps</h3>
              <p className="mt-1 text-sm text-slate-600">Controla el aviso recomendado u obligatorio para iOS y Android sin publicar nuevamente la app.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Versión mínima obligatoria
                  <input value={appMinimumVersion} onChange={(event) => setAppMinimumVersion(event.target.value)} placeholder="1.0.0" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </label>
                <label className="text-sm font-medium text-slate-700">Versión recomendada
                  <input value={appRecommendedVersion} onChange={(event) => setAppRecommendedVersion(event.target.value)} placeholder="1.1.0" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">Mensaje del aviso
                  <textarea value={appUpdateMessage} onChange={(event) => setAppUpdateMessage(event.target.value)} rows={3} maxLength={300} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </label>
                <label className="text-sm font-medium text-slate-700">Enlace de App Store
                  <input type="url" value={iosStoreUrl} onChange={(event) => setIosStoreUrl(event.target.value)} placeholder="https://apps.apple.com/..." className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </label>
                <label className="text-sm font-medium text-slate-700">Enlace de Google Play
                  <input type="url" value={androidStoreUrl} onChange={(event) => setAndroidStoreUrl(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'perfiles' && <AccessProfilesPanel />}
      {activeTab === 'ubicaciones' && <LocationCatalogPanel />}
    </div>
  );
}
