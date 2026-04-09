'use client';

import { useState, FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function ContactoPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validaciones en el cliente
    if (!name.trim() || !message.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (name.length < 2 || name.length > 100) {
      showToast('El nombre debe tener entre 2 y 100 caracteres', 'error');
      return;
    }

    if (message.length < 10 || message.length > 1000) {
      showToast('El mensaje debe tener entre 10 y 1000 caracteres', 'error');
      return;
    }

    if (phone && phone.length > 50) {
      showToast('El teléfono es demasiado largo', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      showToast('¡Mensaje enviado exitosamente! Nos pondremos en contacto pronto.', 'success');

      // Limpiar formulario
      setName('');
      setPhone('');
      setMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar el mensaje';
      showToast(errorMessage, 'error');
      console.error('Error sending contact message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="section-bg min-h-screen py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-900/40 border border-purple-700/50 px-4 py-1.5 rounded-full">
            Estamos para ayudarte
          </span>
          <h1 className="text-4xl font-extrabold text-white mb-4">Contactanos</h1>
          <p className="text-lg text-purple-200/70">
            ¿Tenés alguna pregunta o sugerencia? Nos encantaría escucharte.
          </p>
        </div>

        {/* Contact Form */}
        <div className="animate-fade-up-delay-1 bg-white/5 border border-purple-800/40 backdrop-blur-sm rounded-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-purple-200 mb-2">
                Nombre <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-3 text-white bg-white/10 border border-purple-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-purple-400/50"
                required
                minLength={2}
                maxLength={100}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-purple-400/60">Mínimo 2 caracteres, máximo 100</p>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-purple-200 mb-2">
                Teléfono <span className="text-purple-400/60">(opcional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+595 xxx xxx xxx"
                className="w-full px-4 py-3 text-white bg-white/10 border border-purple-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-purple-400/50"
                maxLength={50}
                disabled={loading}
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-purple-200 mb-2">
                Mensaje <span className="text-pink-400">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribí tu mensaje aquí..."
                rows={6}
                className="w-full px-4 py-3 text-white bg-white/10 border border-purple-700/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none placeholder:text-purple-400/50"
                required
                minLength={10}
                maxLength={1000}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-purple-400/60">{message.length}/1000 caracteres</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-900/40"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar mensaje
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-purple-800/40">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-700/40 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Tiempo de respuesta</h3>
                  <p className="text-sm text-purple-300/60">Respondemos dentro de las 24-48 horas hábiles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-700/40 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Privacidad</h3>
                  <p className="text-sm text-purple-300/60">Tus datos están seguros y no serán compartidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-purple-300/60">
            ¿Preferís explorar por tu cuenta?{' '}
            <a href="/search" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
              Buscar moteles →
            </a>
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
