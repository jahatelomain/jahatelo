'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MobilePageHeader from '@/components/public/MobilePageHeader';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { useAuth } from '@/contexts/AuthContext';

type Preferences = {
  enableNotifications: boolean;
  enableEmail: boolean;
  enablePush: boolean;
  enableAdvertisingPush: boolean;
  notifyNewPromos: boolean;
  notifyPriceDrops: boolean;
  notifyUpdates: boolean;
  notifyReviewReplies: boolean;
  notifyNewMotels: boolean;
};

const defaults: Preferences = {
  enableNotifications: true,
  enableEmail: true,
  enablePush: true,
  enableAdvertisingPush: true,
  notifyNewPromos: true,
  notifyPriceDrops: true,
  notifyUpdates: true,
  notifyReviewReplies: true,
  notifyNewMotels: true,
};

const options: Array<{ key: keyof Preferences; title: string; description: string }> = [
  { key: 'enableNotifications', title: 'Notificaciones', description: 'Control principal de todas las comunicaciones.' },
  { key: 'enablePush', title: 'Notificaciones push', description: 'Avisos en los dispositivos donde uses Jahatelo.' },
  { key: 'enableEmail', title: 'Notificaciones por email', description: 'Novedades importantes en tu correo.' },
  { key: 'enableAdvertisingPush', title: 'Publicidad y promociones', description: 'Ofertas y comunicaciones comerciales.' },
  { key: 'notifyNewPromos', title: 'Nuevas promociones', description: 'Promos publicadas por los moteles.' },
  { key: 'notifyPriceDrops', title: 'Cambios de precios', description: 'Avisos de precios y oportunidades.' },
  { key: 'notifyNewMotels', title: 'Nuevos moteles', description: 'Establecimientos recién publicados.' },
  { key: 'notifyReviewReplies', title: 'Respuestas a reseñas', description: 'Actividad relacionada con tus reseñas.' },
  { key: 'notifyUpdates', title: 'Actualizaciones de Jahatelo', description: 'Cambios relevantes del servicio.' },
];

export default function NotificationPreferencesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/notification-preferences', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las preferencias');
        setPreferences((current) => ({ ...current, ...data.preferences }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las preferencias');
      } finally {
        setLoading(false);
      }
    };

    void loadPreferences();
  }, [authLoading, isAuthenticated]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron guardar las preferencias');
      setPreferences((current) => ({ ...current, ...data.preferences }));
      setMessage('Preferencias guardadas.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <MobilePageHeader title="Notificaciones" />
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 hidden md:block">
            <h1 className="text-3xl font-bold text-slate-900">Notificaciones</h1>
            <p className="mt-2 text-slate-600">Elegí qué novedades querés recibir de Jahatelo.</p>
          </div>

          {!authLoading && !isAuthenticated ? (
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Iniciá sesión para configurar tus avisos</h2>
              <p className="mt-2 text-sm text-slate-600">Tus preferencias se guardan en tu cuenta y se aplican a tus dispositivos.</p>
              <Link href="/login?next=/notificaciones" className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700">Iniciar sesión</Link>
            </section>
          ) : loading || authLoading ? (
            <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Cargando preferencias…</div>
          ) : (
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {options.map((option) => {
                  const disabled = option.key !== 'enableNotifications' && !preferences.enableNotifications;
                  return (
                    <label key={option.key} className={`flex cursor-pointer items-center gap-4 px-5 py-4 ${disabled ? 'opacity-50' : ''}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">{option.title}</span>
                        <span className="mt-0.5 block text-sm text-slate-500">{option.description}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences[option.key]}
                        disabled={disabled}
                        onChange={(event) => setPreferences((current) => ({ ...current, [option.key]: event.target.checked }))}
                        className="h-5 w-5 accent-purple-600"
                      />
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-slate-50 p-5">
                {message && <p role="status" className="mb-3 text-sm font-medium text-green-700">{message}</p>}
                {error && <p role="alert" className="mb-3 text-sm font-medium text-red-700">{error}</p>}
                <button type="button" onClick={() => void save()} disabled={saving} className="w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
                  {saving ? 'Guardando…' : 'Guardar preferencias'}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
