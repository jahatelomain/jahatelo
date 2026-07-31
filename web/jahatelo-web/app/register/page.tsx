'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { register, refreshUser } = useAuth();

  const [registerMethod, setRegisterMethod] = useState<'sms' | 'email'>('sms');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerMethod === 'sms') {
      if (!otpSent) {
        await handleSendOtp();
      } else {
        await handleVerifyOtp();
      }
      return;
    }

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
        if (registerMethod === 'email') {
          const target = `/login?sent=1&email=${encodeURIComponent(email)}`;
          router.push(target);
          router.refresh();
          return;
        }
        // Registro exitoso - redirigir
        const target = redirect || '/';
        router.push(target);
        router.refresh();
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

  const handleSendOtp = async () => {
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

  const handleVerifyOtp = async () => {
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
        body: JSON.stringify({ phone, code: otpCode, name }),
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

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 px-4 py-6 md:flex md:items-center md:justify-center md:px-4 md:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8">
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
            <h2 className="mb-1 text-2xl font-bold text-slate-900 md:mb-2 md:text-xl md:font-semibold">
              Crear Cuenta
            </h2>
            <p className="text-sm text-slate-600 md:text-base">
              Regístrate para guardar tus favoritos y más
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 md:mb-6 md:rounded-lg md:p-4">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 md:rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setRegisterMethod('sms');
                  setError('');
                  setOtpSent(false);
                  setOtpCode('');
                  setResendSeconds(0);
                  setPassword('');
                  setConfirmPassword('');
                  setEmail('');
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors md:rounded-md md:py-2 md:font-medium ${
                  registerMethod === 'sms' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
                }`}
              >
                SMS
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisterMethod('email');
                  setError('');
                  setOtpSent(false);
                  setOtpCode('');
                  setResendSeconds(0);
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors md:rounded-md md:py-2 md:font-medium ${
                  registerMethod === 'email' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
                }`}
              >
                Email
              </button>
            </div>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                placeholder="Tu nick"
              />
            </div>

            {registerMethod === 'sms' ? (
              <>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Teléfono *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                    placeholder="+595 981 234567"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Te enviaremos un código por SMS.
                  </p>
                </div>

                {otpSent && (
                  <div>
                    <label
                      htmlFor="otpCode"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Código *
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-600 md:rounded-lg md:py-3"
                      placeholder="000000"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
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
                    Confirmar Contraseña *
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
              </>
            )}

            <button
              type="submit"
              disabled={registerMethod === 'sms' ? (otpSent ? otpVerifyLoading : otpLoading) : loading}
              className="w-full rounded-xl bg-purple-600 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:py-3 md:font-medium"
            >
              {registerMethod === 'sms'
                ? (otpSent ? (otpVerifyLoading ? 'Verificando...' : 'Verificar y crear cuenta') : (otpLoading ? 'Enviando...' : 'Enviar código'))
                : (loading ? 'Creando cuenta...' : 'Crear cuenta')}
            </button>

            {registerMethod === 'sms' && otpSent && (
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
    </div>
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
