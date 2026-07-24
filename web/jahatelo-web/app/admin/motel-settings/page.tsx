'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

type Preferences = {
  enableNotifications: boolean;
  enableEmail: boolean;
  enablePush: boolean;
  notifyPaymentReminders: boolean;
  notifyContactMessages: boolean;
  notifyMotelApprovals: boolean;
};

const DEFAULTS: Preferences = {
  enableNotifications: true,
  enableEmail: true,
  enablePush: true,
  notifyPaymentReminders: true,
  notifyContactMessages: true,
  notifyMotelApprovals: true,
};

export default function MotelSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await fetch('/api/auth/me');
        const { user } = await me.json();
        if (!user || user.role !== 'MOTEL_ADMIN') return router.replace('/admin');
        setUserId(user.id);
        const response = await fetch(`/api/user/notification-preferences?userId=${user.id}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setPreferences({ ...DEFAULTS, ...data.preferences });
      } catch {
        toast.error('No se pudieron cargar tus preferencias');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router, toast]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...preferences }),
      });
      if (!response.ok) throw new Error();
      toast.success('Preferencias actualizadas');
    } catch {
      toast.error('No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500">Cargando preferencias…</div>;

  const items: Array<{ key: keyof Preferences; title: string; description: string }> = [
    { key: 'enableNotifications', title: 'Alertas internas', description: 'Habilita las alertas operativas de Jahatelo para tu cuenta.' },
    { key: 'enableEmail', title: 'Correo electrónico', description: 'Recibí alertas operativas en el email de tu cuenta.' },
    { key: 'enablePush', title: 'Notificaciones push', description: 'Recibí alertas en los dispositivos vinculados a tu cuenta.' },
    { key: 'notifyPaymentReminders', title: 'Recordatorios de pago', description: 'Avisos sobre vencimientos o estado de facturación.' },
    { key: 'notifyContactMessages', title: 'Mensajes operativos', description: 'Alertas cuando Jahatelo requiera información sobre tu cuenta.' },
    { key: 'notifyMotelApprovals', title: 'Cambios de publicación', description: 'Avisos sobre el estado de publicación de tu motel.' },
  ];

  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-semibold text-slate-900">Preferencias de alertas</h1><p className="mt-1 text-sm text-slate-600">Configurá únicamente cómo recibís avisos de Jahatelo sobre tu propio motel.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">Tu cuenta no puede enviar notificaciones ni campañas a usuarios. Esa función corresponde exclusivamente al equipo de Jahatelo.</div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{items.map((item, index) => <div key={item.key} className={`flex items-start justify-between gap-5 px-6 py-5 ${index ? 'border-t border-slate-100' : ''}`}><div><h2 className="font-medium text-slate-900">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.description}</p></div><button type="button" onClick={() => setPreferences((current) => ({ ...current, [item.key]: !current[item.key] }))} className={`relative mt-1 inline-flex h-6 w-11 shrink-0 rounded-full transition ${preferences[item.key] ? 'bg-purple-600' : 'bg-slate-200'}`} role="switch" aria-checked={preferences[item.key]}><span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${preferences[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>)}</section><div className="flex justify-end"><button disabled={saving} onClick={() => void save()} className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white shadow-sm shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar preferencias'}</button></div></div>;
}
