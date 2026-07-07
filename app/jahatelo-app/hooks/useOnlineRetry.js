import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Dispara `onReconnect` automáticamente cuando el dispositivo
 * pasa de offline → online. Evita disparos en el montaje inicial.
 *
 * @param {Function} onReconnect - Función a ejecutar al reconectar
 */
export const useOnlineRetry = (onReconnect) => {
  const { isOnline } = useNetworkStatus();
  const wasOffline = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // Primer render: registrar estado inicial sin disparar retry
      mounted.current = true;
      wasOffline.current = !isOnline;
      return;
    }

    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      // Pasó de offline → online
      wasOffline.current = false;
      onReconnect?.();
    }
  }, [isOnline, onReconnect]);

  return { isOnline };
};
