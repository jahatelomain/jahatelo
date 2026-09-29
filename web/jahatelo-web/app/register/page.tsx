'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { trackVisitor } from '@/lib/analytics';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { register, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email,
        password,
        name: name || undefined,
      });

      if (result.success) {
        trackVisitor({ event: 'register_complete', path: '/register', metadata: { method: 'email' } });
        const target = `/login?sent=1&email=${encodeURIComponent(email)}`;
        router.push(target);
        router.refresh();
        return;
      } else {
        setError(result.error || 'Error al registrarse');
        setLoading(false);
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };


  return (
    <main className="public-page bg-gradient-to-br from-purple-600 to-purple-800 px-4 py-6 md:flex md:items-center md:justify-center md:px-4 md:py-12">
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
              Crear cuenta
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Creá tu cuenta con email o Google
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div id="register-error" role="alert" className="public-status public-status-error mb-5 md:mb-6">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Nick (opcional)
              </label>
              <input
                id="name"
                type="text"
                autoComplete="nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="Tu nick"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={error ? 'register-error' : undefined}
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
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-describedby={error ? 'register-error' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:py-3 md:font-medium"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Social Login */}
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
                onSuccess={async () => {
                  await refreshUser();
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
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Inicia sesión aquí
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

        {/* Terms note */}
        <p className="mt-4 text-xs text-white/70 text-center px-4">
          Al crear una cuenta, aceptas nuestros{' '}
          <Link href="/terminos" className="underline hover:text-white">
            Términos y Condiciones
          </Link>
          {' '}y{' '}
          <Link href="/privacidad" className="underline hover:text-white">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
