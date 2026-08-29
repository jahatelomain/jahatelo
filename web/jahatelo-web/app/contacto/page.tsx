'use client';

import { FormEvent, useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MobilePageHeader from '@/components/public/MobilePageHeader';
import { useToast } from '@/contexts/ToastContext';

export default function ContactoPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim().length < 2 || message.trim().length < 5) {
      showToast('Completá tu nombre y consulta.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined, message: message.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No pudimos enviar tu consulta.');
      setSent(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No pudimos enviar tu consulta.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <MobilePageHeader title="Contacto y soporte" subtitle="Estamos para ayudarte" />
      <main className="public-page px-4 py-8 md:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">¿En qué podemos ayudarte?</h1>
            <p className="mt-3 text-slate-600">Esta sección es para consultas generales y soporte. Si administrás un motel y querés publicarlo, usá <a href="/registrar-motel" className="font-semibold text-purple-600 underline">Registrar un motel</a>.</p>
          </div>
          <div className="public-card p-6 md:p-8">
            {sent ? (
              <div className="py-8 text-center" role="status">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">Consulta enviada</h2>
                <p className="mt-2 text-slate-600">Nuestro equipo la revisará y se pondrá en contacto si es necesario.</p>
                <button type="button" onClick={() => { setSent(false); setName(''); setPhone(''); setMessage(''); }} className="mt-6 min-h-11 rounded-xl border border-purple-600 px-5 font-semibold text-purple-600 hover:bg-purple-50">Enviar otra consulta</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <label className="block text-sm font-semibold text-slate-800">Nombre
                  <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className="public-input mt-2" placeholder="Tu nombre" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Teléfono <span className="font-normal text-slate-500">(opcional)</span>
                  <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={50} className="public-input mt-2" placeholder="0981 000 000" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Consulta
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={6} className="mt-2 w-full rounded-xl border border-slate-300 p-4 text-slate-950 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Contanos qué necesitás" />
                </label>
                <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-purple-600 px-5 font-bold text-white hover:bg-purple-700 disabled:opacity-60">{loading ? 'Enviando…' : 'Enviar consulta'}</button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
