import * as Sentry from '@sentry/nextjs';

/**
 * Configuración de Sentry para Edge Runtime (middleware)
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Entorno
  environment: process.env.NODE_ENV,

  // Trazas (10% de las transacciones)
  tracesSampleRate: 0.1,

  // Debug solo en desarrollo
  debug: process.env.NODE_ENV === 'development',

  // No enviar en desarrollo
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
