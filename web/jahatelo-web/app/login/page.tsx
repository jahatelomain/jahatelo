'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'whatsapp'>('email');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

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

  const handleSendOtp = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('Ingresa tu número de teléfono');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el código');
        return;
      }
      setOtpSent(true);
      setResendSeconds(60);
      if (data?.debugCode && process.env.NODE_ENV === 'development') {
        setOtpCode(data.debugCode);
      }
    } catch (err) {
      console.error('OTP error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError('Ingresa el código');
      return;
    }
    setOtpVerifyLoading(true);
    try {
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code: otpCode, name: otpName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Código inválido');
        return;
      }
      await refreshUser();
      const target = redirect || '/';
      router.push(target);
      router.refresh();
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setOtpVerifyLoading(false);
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
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-slate-600">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}
          {infoMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                {infoMessage}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setError('');
                setOtpSent(false);
                setOtpCode('');
                setOtpName('');
                setResendSeconds(0);
                setPhone('');
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                loginMethod === 'email' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('whatsapp');
                setError('');
                setEmail('');
                setPassword('');
                setOtpSent(false);
                setOtpCode('');
                setOtpName('');
                setResendSeconds(0);
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                loginMethod === 'whatsapp' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              SMS
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-gray-900"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Número de teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-gray-900"
                  placeholder="+595981234567"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Te enviaremos un código de verificación por SMS.
                </p>
              </div>

              {otpSent && (
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Código de verificación
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-gray-900"
                    placeholder="000000"
                  />
                </div>
              )}

              {otpSent && (
                <div>
                  <label
                    htmlFor="otpName"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Nombre (opcional)
                  </label>
                  <input
                    id="otpName"
                    type="text"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-gray-900"
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={otpSent ? otpVerifyLoading : otpLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpSent
                  ? otpVerifyLoading ? 'Verificando...' : 'Verificar e ingresar'
                  : otpLoading ? 'Enviando...' : 'Enviar código'}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendSeconds > 0 || otpLoading}
                  className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium disabled:text-slate-400"
                >
                  {resendSeconds > 0 ? `Reenviar en ${resendSeconds}s` : 'Reenviar código por SMS'}
                </button>
              )}
            </form>
          )}

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
    </div>
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
