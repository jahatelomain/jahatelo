'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisitor, getOrCreateDeviceId } from '@/lib/analytics';

/**
 * AnalyticsProvider
 * Coloca este componente en el root layout (app/layout.tsx).
 * Trackea automáticamente:
 *   - session_start: primera vez que el usuario llega (o nueva sesión)
 *   - page_view: cada cambio de ruta
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();
  const sessionTracked = useRef(false);
  const lastPath = useRef<string | null>(null);

  // Inicializar deviceId y disparar session_start al montar
  useEffect(() => {
    getOrCreateDeviceId(); // Asegura que el UUID existe desde el primer render

    if (!sessionTracked.current) {
      sessionTracked.current = true;
      // Verificar si es una sesión nueva (no vista en los últimos 30 min)
      const lastActive = sessionStorage.getItem('jhtl_last_active');
      const now = Date.now();
      const SESSION_GAP = 30 * 60 * 1000; // 30 minutos

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

    // No trackear el primer render (ya lo captura session_start)
    if (!sessionTracked.current) return;

    trackVisitor({ event: 'page_view', path: pathname });

    // Actualizar última actividad
    sessionStorage.setItem('jhtl_last_active', String(Date.now()));
  }, [pathname]);

  return null;
}
