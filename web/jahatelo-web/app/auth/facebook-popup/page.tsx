'use client';

import { useEffect } from 'react';

export default function FacebookPopupPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const error = hash.get('error_description') || hash.get('error');

    window.opener?.postMessage(
      {
        type: 'jahatelo-facebook-auth',
        accessToken,
        error,
      },
      window.location.origin
    );
    window.close();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-slate-700">
      <p>Terminando inicio de sesión con Facebook...</p>
    </main>
  );
}
