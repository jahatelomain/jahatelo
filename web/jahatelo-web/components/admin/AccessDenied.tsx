'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Panel principal',
  motels: 'Moteles',
  promos: 'Promociones',
  amenities: 'Amenities',
  users: 'Usuarios',
  configuracion: 'Configuración',
  prospects: 'Prospects',
  analytics: 'Analytics / SEO',
  financiero: 'Financiero',
  notifications: 'Notificaciones',
  banners: 'Banners',
  audit: 'Auditoría',
  inbox: 'Bandeja de entrada / Reportes',
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  MOTEL_ADMIN: 'Motel Admin',
};

type AccessDeniedProps = {
  module?: string | null;
  requiredRole?: 'SUPERADMIN' | 'MOTEL_ADMIN' | string;
  message?: string;
};

export default function AccessDenied({ module, requiredRole, message }: AccessDeniedProps) {
  const moduleName = module ? MODULE_LABELS[module] || module : 'esta sección';
  const roleName = requiredRole ? ROLE_LABELS[requiredRole] || requiredRole : null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Acceso restringido</h1>
      <p className="mt-2 max-w-md text-slate-600">
        {message || `No tenés permisos para acceder a ${moduleName}.`}
      </p>
      {roleName && (
        <p className="mt-1 text-sm text-slate-500">
          Rol requerido: <span className="font-semibold text-slate-700">{roleName}</span>
        </p>
      )}
      <Link
        href="/admin"
        className="mt-8 inline-flex items-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}