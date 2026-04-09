import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiRoot } from './apiBaseUrl';

const STORAGE_KEY = '@jahatelo:staging_basic_auth';
let authHeader = null;
let interceptorInstalled = false;

// Flag de debug para staging auth - solo habilitar cuando se necesite debug detallado
// Uso: EXPO_PUBLIC_DEBUG_STAGING=1 npx expo start
const STAGING_AUTH_DEBUG = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_STAGING === '1';

const debugAuthLog = (...args) => {
  if (STAGING_AUTH_DEBUG) console.log(...args);
};

const infoAuthLog = (...args) => {
  // Logs importantes siempre visibles en dev
  if (__DEV__) console.log(...args);
};

const toBase64 = (value) => {
  if (typeof global.btoa === 'function') {
    return global.btoa(value);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  while (i < value.length) {
    const chr1 = value.charCodeAt(i++);
    const chr2 = value.charCodeAt(i++);
    const chr3 = value.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = Number.isNaN(chr2) ? 64 : (((chr2 & 15) << 2) | (chr3 >> 6));
    const enc4 = Number.isNaN(chr3) ? 64 : (chr3 & 63);

    output += chars.charAt(enc1);
    output += chars.charAt(enc2);
    output += chars.charAt(enc3);
    output += chars.charAt(enc4);
  }

  return output;
};

const getStagingHostname = () => {
  try {
    return new URL(getApiRoot()).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const isStagingHostname = (hostname) => hostname.includes('staging.jahatelo.com');

export const isStagingEnvironment = () => isStagingHostname(getStagingHostname());

export const getStagingAuthHeader = () => authHeader;

export const setStagingCredentials = async (username, password, persist = true) => {
  const encoded = toBase64(`${username}:${password}`);
  authHeader = `Basic ${encoded}`;

  infoAuthLog('🔐 [STAGING AUTH] Credenciales configuradas');
  debugAuthLog('   Username:', username.substring(0, 3) + '***'); // Redacted
  debugAuthLog('   Auth header length:', authHeader?.length);      // No el valor
  debugAuthLog('   Persist:', persist);

  if (persist) {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        username,
        password,
      })
    );
    infoAuthLog('💾 [STAGING AUTH] Credenciales guardadas en AsyncStorage');
  }
};

export const loadStoredStagingCredentials = async () => {
  debugAuthLog('📂 [STAGING AUTH] Cargando credenciales desde AsyncStorage...');
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    infoAuthLog('⚠️  [STAGING AUTH] No hay credenciales guardadas');
    return false;
  }

  try {
    const data = JSON.parse(raw);
    if (!data?.username || !data?.password) {
      infoAuthLog('⚠️  [STAGING AUTH] Credenciales inválidas en storage');
      return false;
    }
    await setStagingCredentials(data.username, data.password, false);
    infoAuthLog('✅ [STAGING AUTH] Credenciales cargadas desde storage');
    return true;
  } catch (error) {
    console.error('❌ [STAGING AUTH] Error al cargar credenciales:', error);
    return false;
  }
};

export const clearStoredStagingCredentials = async () => {
  authHeader = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const installStagingFetchInterceptor = () => {
  if (interceptorInstalled) {
    debugAuthLog('🔐 [STAGING AUTH] Interceptor ya instalado');
    return;
  }

  const originalFetch = global.fetch;
  global.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;
    if (!requestUrl) {
      return originalFetch(input, init);
    }

    let shouldAttachAuth = false;
    try {
      const hostname = new URL(requestUrl).hostname.toLowerCase();
      shouldAttachAuth = isStagingHostname(hostname);
    } catch {
      shouldAttachAuth = false;
    }

    if (!shouldAttachAuth) {
      // Request no es a staging, continuar sin auth
      return originalFetch(input, init);
    }

    // Request ES a staging - verificar si tenemos credenciales
    if (!authHeader) {
      console.error('🚨 [STAGING AUTH] Request a staging SIN credenciales cargadas!');
      debugAuthLog('🚨 URL:', requestUrl);
      // Continuar sin auth - el backend va a responder 401
      return originalFetch(input, init);
    }

    // Adjuntar Authorization header
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', authHeader);
      debugAuthLog('✅ [STAGING AUTH] Authorization header adjuntado');
      debugAuthLog('   URL:', requestUrl);
      debugAuthLog('   Header length:', authHeader?.length); // No exponer valor
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  };

  interceptorInstalled = true;
  infoAuthLog('🔐 [STAGING AUTH] Interceptor de fetch instalado correctamente');
};
