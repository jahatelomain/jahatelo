'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Login exitoso - redirigir
      const target = redirect || '/admin';
      router.replace(target);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-0 mb-4">
              <img src="/logo-icon.png" alt="Jahatelo" className="w-16 h-16 object-contain" />
              <img
                src="/logo-text-gradient.png"
                alt="Jahatelo"
                className="h-9 w-auto object-contain -ml-0.5"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Panel Admin
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600" data-testid="admin-login-error">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                data-testid="admin-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                data-testid="admin-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="admin-login-submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Volver al sitio
            </Link>
          </div>
        </div>

        {/* Development hint */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-xs text-white/80 text-center">
              Credenciales de prueba: admin@jahatelo.com / Admin123!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
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
