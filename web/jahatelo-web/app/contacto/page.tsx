'use client';

import { useState, FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SectionWrapper from '@/components/public/SectionWrapper';

export default function ContactoPage() {
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [motelName, setMotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!contactName.trim() || !phone.trim() || !motelName.trim()) {
      showToast('Por favor completá los campos requeridos', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          motelName: motelName.trim(),
          channel: 'WEB',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud');
      }

      setSent(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar la solicitud';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <SectionWrapper className="min-h-screen py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-up">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-900/40 border border-purple-700/50 px-4 py-1.5 rounded-full">
              Sumá tu motel
            </span>
            <h1 className="text-4xl font-extrabold text-white mb-4">¿Tenés un motel?</h1>
            <p className="text-lg text-purple-200/70">
              Dejanos tus datos y te contactamos para que tu motel aparezca en Jahatelo.
            </p>
          </div>

          {sent ? (
            /* Estado de éxito */
            <div className="animate-fade-up bg-white/5 border border-purple-800/40 backdrop-blur-sm rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">¡Solicitud enviada!</h2>
              <p className="text-purple-200/70">
                Recibimos tus datos. Nuestro equipo se va a comunicar con vos al <strong className="text-white">{phone}</strong> a la brevedad.
              </p>
              <button
                onClick={() => { setSent(false); setContactName(''); setPhone(''); setEmail(''); setMotelName(''); }}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-4"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            /* Formulario */
            <div className="animate-fade-up bg-white/5 border border-purple-800/40 backdrop-blur-sm rounded-2xl p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre del motel */}
                <div>
                  <label htmlFor="motelName" className="block text-sm font-semibold text-purple-200 mb-2">
                    Nombre del motel <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="motelName"
                    value={motelName}
                    onChange={(e) => setMotelName(e.target.value)}
                    placeholder="Ej: Motel Los Pinos"
                    className="w-full px-4 py-3 text-white bg-white/10 border border-purple-600/60 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-purple-300/60 outline-none"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                {/* Nombre de contacto */}
                <div>
                  <label htmlFor="contactName" className="block text-sm font-semibold text-purple-200 mb-2">
                    Tu nombre <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nombre del responsable o propietario"
                    className="w-full px-4 py-3 text-white bg-white/10 border border-purple-600/60 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-purple-300/60 outline-none"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                {/* Celular */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-purple-200 mb-2">
                    Nro de celular / WhatsApp <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+595 9xx xxx xxx"
                    className="w-full px-4 py-3 text-white bg-white/10 border border-purple-600/60 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-purple-300/60 outline-none"
                    required
                    maxLength={50}
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-purple-400/60">Ingresá un número donde podamos contactarte por WhatsApp</p>
                </div>

                {/* Email (opcional) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-purple-200 mb-2">
                    Email <span className="text-purple-400/60">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 text-white bg-white/10 border border-purple-600/60 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-purple-300/60 outline-none"
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-900/40 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Quiero sumar mi motel
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-purple-800/40 text-center">
                <p className="text-sm text-purple-300/60">
                  Nos comunicaremos con vos por teléfono o WhatsApp a la brevedad.
                </p>
              </div>
            </div>
          )}
        </div>
      </SectionWrapper>
      <Footer />
    </>
  );
}
