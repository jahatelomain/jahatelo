'use client';

import { useEffect } from 'react';

export default function FacebookPopupPage() {
  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#/, '');
    const hash = new URLSearchParams(rawHash);
    const accessToken = hash.get('access_token');
    const error = hash.get('error_description') || hash.get('error');

    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'jahatelo-facebook-auth',
          accessToken,
          error,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    const appCallbackUrl = rawHash
      ? `jahatelo://oauth/facebook#${rawHash}`
      : `jahatelo://oauth/facebook${window.location.search || ''}`;

    window.location.replace(appCallbackUrl);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-slate-700">
      <p>Terminando inicio de sesión con Facebook...</p>
    </main>
  );
}
