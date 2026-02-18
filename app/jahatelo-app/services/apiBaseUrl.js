import Constants from 'expo-constants';

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

/** Versión de la app, leída del manifest de Expo */
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

/**
 * Headers base que deben incluirse en todos los requests a /api/mobile/.
 * Incluye X-App-Version para que el backend pueda detectar versiones obsoletas.
 */
export const getAppHeaders = (extraHeaders = {}) => ({
  'Content-Type': 'application/json',
  'X-App-Version': __DEV__ ? 'dev' : APP_VERSION,
  ...extraHeaders,
});

/**
 * Verifica si la respuesta es un error 426 (versión desactualizada).
 * De ser así, devuelve el mensaje de error; si no, devuelve null.
 */
export const checkVersionUpgradeRequired = async (response) => {
  if (response.status === 426) {
    try {
      const data = await response.clone().json();
      return data.error || 'Tu versión de la app es muy antigua. Por favor actualizala desde la tienda.';
    } catch {
      return 'Tu versión de la app es muy antigua. Por favor actualizala desde la tienda.';
    }
  }
  return null;
};

const getHostUri = () => {
  return (
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.extra?.expoClient?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.hostUri ||
    Constants.manifest?.debuggerHost ||
    null
  );
};

const deriveLocalApiUrl = () => {
  const hostUri = getHostUri();
  if (!hostUri) return null;
  const cleaned = hostUri.replace(/^https?:\/\//, '');
  const host = cleaned.split('/')[0]?.split(':')[0];
  if (!host || host === 'localhost') return null;
  return `http://${host}:3000`;
};

export const getApiRoot = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeBaseUrl(envUrl.trim());
  }

  if (__DEV__) {
    const derived = deriveLocalApiUrl();
    if (derived) return normalizeBaseUrl(derived);
  }

  // En producción, EXPO_PUBLIC_API_URL debe estar definida.
  // Si no lo está, registramos el error para que sea visible en logs de crash.
  if (!__DEV__) {
    console.error(
      '[apiBaseUrl] EXPO_PUBLIC_API_URL no está definida en el build de producción. ' +
      'Los requests fallarán. Configurá la variable en eas.json o en el portal de EAS.'
    );
  }

  return 'http://localhost:3000';
};

export const getApiBase = () => `${getApiRoot()}/api`;

export const getMobileApiBase = () => `${getApiRoot()}/api/mobile`;
