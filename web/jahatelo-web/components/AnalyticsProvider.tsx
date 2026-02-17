'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisitor, getOrCreateDeviceId } from '@/lib/analytics';

/**
 * AnalyticsProvider
 * Coloca este componente en el root layout (app/layout.tsx).
 * Trackea automticamente:
 *   - session_start: primera vez que el usuario llega (o nueva sesin)
 *   - page_view: cada cambio de ruta
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();
  const sessionTracked = useRef(false);
  const lastPath = useRef<string | null>(null);

  // Inicializar deviceId y disparar session_start al montar
  useEffect(() => {
    // No trackear rutas del panel admin
    if (pathname?.startsWith('/admin')) return;

    getOrCreateDeviceId();

    if (!sessionTracked.current) {
      sessionTracked.current = true;
      const lastActive = sessionStorage.getItem('jhtl_last_active');
      const now = Date.now();
      const SESSION_GAP = 30 * 60 * 1000;

      if (!lastActive || now - parseInt(lastActive, 10) > SESSION_GAP) {
        trackVisitor({ event: 'session_start', path: pathname });
      }
      sessionStorage.setItem('jhtl_last_active', String(now));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trackear page_view en cada cambio de ruta
  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    // No trackear admin ni el primer render
    if (pathname.startsWith('/admin')) return;
    if (!sessionTracked.current) return;

    trackVisitor({ event: 'page_view', path: pathname });

    sessionStorage.setItem('jhtl_last_active', String(Date.now()));
  }, [pathname]);

  return null;
}
