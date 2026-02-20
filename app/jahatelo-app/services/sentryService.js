import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

/**
 * Inicializa Sentry para React Native / Expo.
 * Solo captura errores en producción.
 * Configura filtrado de datos sensibles.
 */
export const initSentry = () => {
  if (!DSN) {
    if (!__DEV__) {
      console.error('[Sentry] EXPO_PUBLIC_SENTRY_DSN no está definida. Los errores no se reportarán.');
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: APP_VERSION,

    // 10% de trazas de performance
    tracesSampleRate: 0.1,

    // No enviar eventos en desarrollo
    beforeSend(event) {
      if (__DEV__) return null;

      // Filtrar datos sensibles
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      if (event.request?.data) {
        const data = event.request.data;
        if (data?.password) data.password = '[FILTERED]';
        if (data?.token) data.token = '[FILTERED]';
      }

      return event;
    },

    debug: false,
  });
};

/**
 * Asocia el usuario autenticado a los eventos de Sentry.
 * Llamar al hacer login.
 */
export const setSentryUser = (user) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    // No incluir email ni nombre por privacidad
  });
};

/**
 * Captura un error manualmente con contexto adicional.
 */
export const captureError = (error, context = {}) => {
  if (__DEV__) {
    console.error('[Sentry captureError]', error, context);
    return;
  }
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
};
