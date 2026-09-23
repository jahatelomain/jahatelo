'use client';

import { useEffect, useMemo, useState } from 'react';

interface FacebookLoginButtonProps {
  onSuccess: (user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    isEmailVerified?: boolean;
  }) => void;
  onError?: (error: string) => void;
}

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const GRAPH_VERSION = 'v20.0';

export default function FacebookLoginButton({ onSuccess, onError }: FacebookLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const configured = Boolean(FACEBOOK_APP_ID);

  const redirectUri = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/facebook-popup`;
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'jahatelo-facebook-auth') return;
      if (loading) return;

      const accessToken = event.data.accessToken;
      if (!accessToken) {
        onError?.('Facebook no devolvió una credencial válida');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/facebook/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ provider: 'facebook', accessToken }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión con Facebook');
        onSuccess(data.user);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loading, onError, onSuccess]);

  const startLogin = () => {
    if (!configured || !FACEBOOK_APP_ID || !redirectUri) {
      onError?.('Facebook Login no está configurado');
      return;
    }

    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set('client_id', FACEBOOK_APP_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('scope', 'public_profile,email');

    const width = 520;
    const height = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    window.open(
      url.toString(),
      'facebook-login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  if (!configured) return null;

  return (
    <button
      type="button"
      onClick={startLogin}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      aria-busy={loading}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-sm font-bold text-white">f</span>
      {loading ? 'Conectando...' : 'Continuar con Facebook'}
    </button>
  );
}
