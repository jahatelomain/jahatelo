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
      {!isAuthenticationRoute && <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
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
      }
    </div>
  );
}
