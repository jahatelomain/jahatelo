/**
 * Analytics Service (Web)
 * Servicio para trackear eventos de analytics en la web
 */

interface TrackEventParams {
  motelId: string;
  eventType: 'VIEW' | 'CLICK_PHONE' | 'CLICK_WHATSAPP' | 'CLICK_MAP' | 'CLICK_WEBSITE' | 'FAVORITE_ADD' | 'FAVORITE_REMOVE';
  source?: string;
  metadata?: Record<string, unknown>;
}

import { trackVisitor, type VisitorEventType } from '@/lib/analytics';

const VISITOR_EVENT_BY_MOTEL_EVENT: Record<TrackEventParams['eventType'], VisitorEventType> = {
  VIEW: 'motel_view',
  CLICK_PHONE: 'phone_click',
  CLICK_WHATSAPP: 'whatsapp_click',
  CLICK_MAP: 'map_click',
  CLICK_WEBSITE: 'website_click',
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
};

/**
 * Track un evento de analytics
 */
export const trackEvent = async ({ motelId, eventType, source, metadata }: TrackEventParams) => {
  try {
    const visitorTracking = trackVisitor({
      event: VISITOR_EVENT_BY_MOTEL_EVENT[eventType],
      metadata: { ...metadata, motelId, source },
    });
    // No bloquear la UI si falla el tracking
    await Promise.all([visitorTracking, fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        motelId,
        eventType,
        source,
        deviceType: 'WEB',
        metadata,
      }),
    })]);
  } catch (error) {
    // Silenciosamente fallar - no queremos interrumpir la experiencia del usuario
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics tracking failed (non-critical):', error);
    }
  }
};

/**
 * Track vista de motel
 */
export const trackMotelView = (motelId: string, source: string = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'VIEW',
    source,
  });
};

/**
 * Track click en teléfono
 */
export const trackPhoneClick = (motelId: string, source: string = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_PHONE',
    source,
  });
};

/**
 * Track click en WhatsApp
 */
export const trackWhatsAppClick = (motelId: string, source: string = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_WHATSAPP',
    source,
  });
};

/**
 * Track click en mapa / direcciones
 */
export const trackMapClick = (motelId: string, source: string = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_MAP',
    source,
  });
};

/**
 * Track click en sitio web
 */
export const trackWebsiteClick = (motelId: string, source: string = 'DETAIL') => {
  return trackEvent({
    motelId,
    eventType: 'CLICK_WEBSITE',
    source,
  });
};

/**
 * Track agregar a favoritos
 */
export const trackFavoriteAdd = (motelId: string, source: string = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'FAVORITE_ADD',
    source,
  });
};

/**
 * Track remover de favoritos
 */
export const trackFavoriteRemove = (motelId: string, source: string = 'LIST') => {
  return trackEvent({
    motelId,
    eventType: 'FAVORITE_REMOVE',
    source,
  });
};
