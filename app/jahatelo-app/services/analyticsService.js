/**
 * Analytics Service
 * Servicio para trackear eventos de analytics en la app móvil
 */

import { getApiRoot } from './apiBaseUrl';

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
    // No bloquear la UI si falla el tracking
    await fetch(`${API_URL}/api/analytics/track`, {
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
    });
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
