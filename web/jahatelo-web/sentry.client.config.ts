import * as Sentry from '@sentry/nextjs';

/**
 * Configuración de Sentry para el cliente (browser)
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Entorno
  environment: process.env.NODE_ENV,

  // Trazas (10% de las transacciones)
  tracesSampleRate: 0.1,

  // Debug solo en desarrollo
  debug: process.env.NODE_ENV === 'development',

  // No enviar errores en desarrollo
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      return null;
    }
    return event;
  },

  // Replay: solo capturar sesiones con errores
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
