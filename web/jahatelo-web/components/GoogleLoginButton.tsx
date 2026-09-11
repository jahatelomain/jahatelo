'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    isEmailVerified?: boolean;
  }) => void;
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCredential = async ({ credential }: CredentialResponse) => {
    if (loading) return;
    if (!credential) {
      onError?.('Google no devolvió una credencial válida');
      return;
    }
    setLoading(true);
    try {
      // GIS returns a signed ID token, not an access token or a trusted profile.
      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'google', idToken: credential }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión con Google');
      onSuccess(data.user);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div aria-busy={loading} className="flex flex-col items-center gap-2">
      <div className={loading ? 'pointer-events-none opacity-50' : undefined}>
        <GoogleLogin onSuccess={handleCredential} onError={() => onError?.('No se pudo conectar con Google')} text="continue_with" />
      </div>
      {loading && <span role="status">Conectando...</span>}
    </div>
  );
}
