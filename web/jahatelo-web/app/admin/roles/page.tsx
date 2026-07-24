'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Ruta legacy: los perfiles reemplazan los permisos individuales. */
export default function LegacyRolesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/configuracion');
  }, [router]);

  return <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Redirigiendo a Perfiles de acceso…</div>;
}
