/**
 * sentryService.js
 *
 * Inicialización de Sentry para la app mobile.
 * Usa el mismo DSN que el proyecto web — los errores se diferencian por el tag platform=mobile.
 *
 * SETUP (ejecutar una sola vez):
 *   npm install @sentry/react-native
 *   npx @sentry/wizard@latest -i reactNative
 *   # Esto agrega el plugin al app.json y genera ios/android/sentry.properties
 *
 * Variable de entorno en .env:
 *   EXPO_PUBLIC_SENTRY_DSN=https://ba2ed1053d9cabfd59592912d7e55b3e@o4510703986671616.ingest.us.sentry.io/4511571092766720
 */

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  'https://ba2ed1053d9cabfd59592912d7e55b3e@o4510703986671616.ingest.us.sentry.io/4511571092766720';

let Sentry = null;

/**
 * Inicializa Sentry solo en producción.
 * Llamar una vez al inicio de la app (antes de renderizar).
 */
export function initSentry() {
  if (__DEV__) return;

  try {
    // Importación dinámica para evitar error si el paquete no está instalado todavía
    Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      enableTracing: true,
      integrations: [
        Sentry.reactNativeTracingIntegration(),
      ],
      // Tag para distinguir errores mobile vs web en el mismo proyecto Sentry
      initialScope: {
        tags: { platform: 'mobile' },
      },
    });
  } catch {
    // Si el paquete no está instalado, falla silencioso
  }
}

/**
 * Captura un error manualmente.
 * Usar en catch blocks críticos.
 * @param {Error} error
 * @param {object} context - extras para el evento (screen, action, etc.)
 */
export function captureError(error, context = {}) {
  if (__DEV__ || !Sentry) {
    console.error('[Sentry]', error, context);
    return;
  }
  Sentry.withScope((scope) => {
    scope.setTag('platform', 'mobile');
    Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
    Sentry.captureException(error);
  });
}

/**
 * Registra un usuario autenticado en Sentry para trazabilidad.
 */
export function setSentryUser(user) {
  if (!Sentry) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
