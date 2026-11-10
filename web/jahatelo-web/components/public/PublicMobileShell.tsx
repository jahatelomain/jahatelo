'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, UserRound } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Inicio', Icon: Home, exact: true },
  { href: '/mis-favoritos', label: 'Favoritos', Icon: Heart },
  { href: '/perfil', label: 'Perfil', Icon: UserRound },
];

/** Barra inferior móvil equivalente a las tabs principales de la app nativa. */
export default function PublicMobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;
  const isAuthenticationRoute = pathname === '/login' || pathname === '/register';

  return (
    <div className={isAuthenticationRoute ? 'md:pb-0' : 'pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0'}>
      {children}
      {!isAuthenticationRoute && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          <nav aria-label="Navegación principal" className="px-5 pt-2 pb-1">
            <div className="mx-auto flex max-w-md items-center justify-around">
              {tabs.map(({ href, label, Icon, exact }) => {
                const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link key={href} href={href} className={`flex min-w-20 flex-col items-center gap-1 rounded-2xl px-4 py-1.5 text-xs font-semibold transition-colors ${active ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:text-purple-600'}`}>
                    <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="flex items-center justify-center gap-3 border-t border-slate-100 px-4 py-1.5 pb-[max(6px,env(safe-area-inset-bottom))] text-[10px] text-slate-400">
            <Link href="/privacidad" className="hover:text-purple-600 transition-colors">Privacidad</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terminos" className="hover:text-purple-600 transition-colors">Términos</Link>
            <span aria-hidden="true">·</span>
            <Link href="/eliminar-cuenta" className="hover:text-purple-600 transition-colors">Eliminar cuenta</Link>
          </div>
        </div>
      )}
    </div>
  );
}
