/**
 * Analytics Service
 * Servicio para trackear eventos de analytics en la app móvil.
 * Incluye tracking de moteles (MotelAnalytics) y visitantes anónimos (VisitorEvent).
 */

import { getApiRoot } from './apiBaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getStoredToken } from './authApi';

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const API_URL = getApiRoot();
const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

/**
 * Track un evento de analytics
 * @param {Object} params
 * @param {string} params.motelId - ID del motel
 * @param {string} params.eventType - Tipo de evento (VIEW, CLICK_PHONE, etc.)
 * @param {string} [params.source] - Origen del evento (MAP, LIST, SEARCH, etc.)
 * @param {Object} [params.metadata] - Datos adicionales
 */
export const trackEvent = async ({ motelId, eventType, source, metadata }) => {
  try {
    const visitorEventByType = {
      VIEW: 'motel_view',
      CLICK_PHONE: 'phone_click',
      CLICK_WHATSAPP: 'whatsapp_click',
      CLICK_MAP: 'map_click',
      CLICK_WEBSITE: 'website_click',
      FAVORITE_ADD: 'favorite_add',
      FAVORITE_REMOVE: 'favorite_remove',
    };
    const visitorTracking = trackVisitor(visitorEventByType[eventType], null, { ...metadata, motelId, source });
    // No bloquear la UI si falla el tracking
    await Promise.all([visitorTracking, fetch(`${API_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        motelId,
        eventType,
        source,
        deviceType: 'MOBILE',
        metadata,
      }),
    })]);
  } catch (error) {
    // Silenciosamente fallar - no queremos interrumpir la experiencia del usuario
    debugLog('Analytics tracking failed (non-critical):', error.message);
  }
};

/**
 * Track vista de motel
 */
export const trackMotelView = (motelId, source = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'VIEW',
    source,
  });
};

/**
 * Track click en teléfono
 */
export const trackPhoneClick = (motelId, source = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_PHONE',
    source,
  });
};

/**
 * Track click en WhatsApp
 */
export const trackWhatsAppClick = (motelId, source = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_WHATSAPP',
    source,
  });
};

/**
 * Track click en mapa / direcciones
 */
export const trackMapClick = (motelId, source = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_MAP',
    source,
  });
};

/**
 * Track click en sitio web
 */
export const trackWebsiteClick = (motelId, source = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_WEBSITE',
    source,
  });
};

/**
 * Track agregar a favoritos
 */
export const trackFavoriteAdd = (motelId, source = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'FAVORITE_ADD',
    source,
  });
};

/**
 * Track remover de favoritos
 */
export const trackFavoriteRemove = (motelId, source = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'FAVORITE_REMOVE',
    source,
  });
};

// ============================================
// VISITOR TRACKING (usuarios anónimos)
// ============================================

const DEVICE_ID_KEY = 'jhtl_device_id';
const SESSION_KEY = 'jhtl_session_ts';
const SESSION_ID_KEY = 'jhtl_session_id';
const SESSION_GAP = 30 * 60 * 1000; // 30 minutos

/**
 * Obtiene o crea el UUID anónimo del dispositivo.
 * Se persiste en AsyncStorage (sobrevive cierres de app, se borra al desinstalar).
 */
export const getOrCreateDeviceId = async () => {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `fallback-${Date.now()}`;
  }
};

/**
 * Envía un evento de visitante anónimo al backend.
 * @param {'session_start'|'screen_view'|'motel_view'|'search'|'map_view'} event
 * @param {string} [screen] - Nombre de la pantalla o path
 * @param {Object} [metadata] - Datos extra (motelId, query, etc.)
 */
export const trackVisitor = async (event, screen, metadata) => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const platform = Platform.OS; // 'ios' | 'android'
    const now = Date.now();
    const [lastTs, storedSessionId, token] = await Promise.all([
      AsyncStorage.getItem(SESSION_KEY),
      AsyncStorage.getItem(SESSION_ID_KEY),
      getStoredToken(),
    ]);
    const isNewSession = !lastTs || !storedSessionId || now - parseInt(lastTs, 10) > SESSION_GAP;
    const sessionId = isNewSession ? generateUUID() : storedSessionId;
    await AsyncStorage.multiSet([[SESSION_KEY, String(now)], [SESSION_ID_KEY, sessionId]]);
    if (event === 'session_start' && !isNewSession) return;

    const send = (eventName) => fetch(`${getApiRoot()}/api/analytics/visitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventId: generateUUID(),
        deviceId,
        sessionId,
        platform,
        event: eventName,
        path: screen ?? null,
        metadata: metadata ?? null,
      }),
    });

    if (isNewSession && event !== 'session_start') await send('session_start');
    await send(event);
  } catch {
    // Silencioso
  }
};

/**
 * Llama al inicio de la app (App.js o _layout.tsx).
 * Detecta si es una nueva sesión y trackea session_start.
 */
export const trackAppOpen = async () => {
  return trackVisitor('session_start');
};

/**
 * Trackea una vista de pantalla.
 * Llamar en el useEffect de cada screen principal.
 */
export const trackScreenView = (screenName, metadata) => {
  const eventByScreen = {
    Search: 'search',
    Map: 'map_view',
    NearbyMotels: 'map_view',
    CitySelector: 'city_view',
    CityMotels: 'city_view',
    Register: 'register_start',
    RegisterMotel: 'register_start',
  };
  return trackVisitor(eventByScreen[screenName] || 'screen_view', screenName, metadata);
};

/**
 * Trackea cuando el usuario ve el detalle de un motel.
 */
export const trackMotelViewVisitor = (motelSlug) => {
  return trackVisitor('motel_view', `/moteles/${motelSlug}`, { motelSlug });
};

/**
 * Trackea una búsqueda.
 */
export const trackSearch = (query) => {
  return trackVisitor('search', null, { query });
};
