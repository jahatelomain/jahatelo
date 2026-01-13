import * as Sentry from '@sentry/nextjs';

/**
 * Configuración de Sentry para el servidor (Node.js)
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Entorno
  environment: process.env.NODE_ENV,

  // Trazas (10% de las transacciones)
  tracesSampleRate: 0.1,

  // Debug solo en desarrollo
  debug: process.env.NODE_ENV === 'development',

  // Filtrar información sensible
  beforeSend(event, hint) {
    // No enviar en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Event:', event);
      return null;
    }

    // Filtrar headers sensibles
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Filtrar datos sensibles del body
    if (event.request?.data) {
      const data = event.request.data as any;
      if (data.password) data.password = '[FILTERED]';
      if (data.passwordHash) data.passwordHash = '[FILTERED]';
      if (data.token) data.token = '[FILTERED]';
    }

    return event;
  },
});
