'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import FacebookLoginButton from '@/components/FacebookLoginButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Login exitoso - redirigir
        const target = redirect || '/';
        router.push(target);
        router.refresh();
      } else {
        setError(result.error || 'Error al iniciar sesión');
        setNeedsVerification('needsVerification' in result ? !!result.needsVerification : false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email para reenviar la verificación');
      return;
    }
    setResendLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await fetch('/api/auth/email/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setInfoMessage('Te enviamos el correo de verificación. Revisá tu bandeja.');
      } else {
        const data = await res.json();
        setError(data.error || 'No se pudo enviar el correo');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const verified = searchParams.get('verified');
    const sent = searchParams.get('sent');
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (sent === '1') {
      setInfoMessage('Te enviamos un correo de verificación. Revisá tu bandeja.');
    }
    if (verified === '1') {
      setInfoMessage('Correo verificado. Ya podés iniciar sesión.');
    }
    if (verified === '0') {
      setError('El enlace de verificación es inválido o expiró.');
    }
  }, [searchParams]);


  return (
    <main className="public-page bg-gradient-to-br from-purple-600 to-purple-800 px-4 py-6 md:flex md:items-center md:justify-center md:px-4 md:py-0">
      <div className="mx-auto w-full max-w-md">
        <div className="public-card p-6 sm:p-8">
          {/* Header */}
          <div className="mb-7 text-center md:mb-8">
            <div className="flex items-center justify-center gap-0 mb-4">
              <Image src="/logo-icon.png" alt="Jahatelo" width={64} height={64} className="h-14 w-14 object-contain md:h-16 md:w-16" />
              <Image
                src="/logo-text-gradient.png"
                alt="Jahatelo"
                width={160}
                height={36}
                className="-ml-0.5 h-8 w-auto object-contain md:h-9"
              />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900 md:mb-2 md:font-semibold">
              Iniciar sesión
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Ingresá con email, Google o Facebook
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div id="login-error" role="alert" className="public-status public-status-error mb-5 md:mb-6">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}
          {infoMessage && (
            <div role="status" aria-live="polite" className="public-status public-status-success mb-5 md:mb-6">
              <p className="text-sm text-emerald-700">
                {infoMessage}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={error ? 'login-error' : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-describedby={error ? 'login-error' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:py-3 md:font-medium"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            {needsVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium disabled:text-slate-400"
              >
                {resendLoading ? 'Enviando...' : 'Reenviar correo de verificación'}
              </button>
            )}
          </form>

          {/* Google Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-slate-400">o continuá con</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <GoogleLoginButton
                onSuccess={() => {
                  const target = redirect || '/';
                  router.push(target);
                  router.refresh();
                }}
                onError={(msg) => setError(msg)}
              />
              <FacebookLoginButton
                onSuccess={() => {
                  const target = redirect || '/';
                  router.push(target);
                  router.refresh();
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-slate-600">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
            <Link
              href="/"
              className="block text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
