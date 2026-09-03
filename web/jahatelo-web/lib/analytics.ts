/**
 * Analytics anónimo para web
 * Genera un UUID por browser, lo persiste en cookie y envía eventos al backend.
 * No requiere registro ni permisos del usuario.
 */

const DEVICE_ID_KEY = 'jhtl_did';
const SESSION_ID_KEY = 'jhtl_sid';
const LAST_ACTIVE_KEY = 'jhtl_last_active';
const SESSION_GAP = 30 * 60 * 1000;
const COOKIE_DAYS = 730; // 2 años

export function generateAnalyticsId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback manual
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';

  // Intentar desde cookie primero
  let id = getCookie(DEVICE_ID_KEY);
  if (id) return id;

  // Intentar desde localStorage como respaldo
  try {
    id = localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    id = null;
  }

  if (!id) {
    id = generateAnalyticsId();
  }

  // Persistir en ambos
  setCookie(DEVICE_ID_KEY, id, COOKIE_DAYS);
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // localStorage puede no estar disponible (modo privado estricto)
  }

  return id;
}

export type VisitorEventType =
  | 'session_start'
  | 'page_view'
  | 'screen_view'
  | 'motel_view'
  | 'search'
  | 'city_view'
  | 'map_view'
  | 'favorite_add'
  | 'favorite_remove'
  | 'phone_click'
  | 'whatsapp_click'
  | 'map_click'
  | 'website_click'
  | 'promo_view'
  | 'promo_claim'
  | 'register_start'
  | 'register_complete';

interface TrackOptions {
  event: VisitorEventType;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  eventId?: string;
  context?: AnalyticsContext;
}

export type AnalyticsContext = {
  deviceId: string;
  sessionId: string;
  isNewSession: boolean;
};

export function getAnalyticsContext(): AnalyticsContext | null {
  if (typeof window === 'undefined') return null;
  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return null;

  const now = Date.now();
  const lastActive = Number(sessionStorage.getItem(LAST_ACTIVE_KEY) || 0);
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  const isNewSession = !sessionId || !lastActive || now - lastActive > SESSION_GAP;
  if (isNewSession) {
    sessionId = generateAnalyticsId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  sessionStorage.setItem(LAST_ACTIVE_KEY, String(now));
  if (!sessionId) return null;

  return { deviceId, sessionId, isNewSession };
}

export async function trackVisitor(opts: TrackOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const context = opts.context ?? getAnalyticsContext();
  if (!context) return;
  const { deviceId, sessionId, isNewSession } = context;

  if (opts.event === 'session_start' && !isNewSession) return;

  const send = (event: VisitorEventType, path = opts.path, eventId = generateAnalyticsId()) => fetch('/api/analytics/visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      deviceId,
      sessionId,
      platform: 'web',
      event,
      path,
      referrer: opts.referrer ?? document.referrer ?? undefined,
      metadata: opts.metadata,
    }),
    keepalive: true,
  });

  try {
    if (isNewSession && opts.event !== 'session_start') await send('session_start', opts.path);
    await send(opts.event, opts.path, opts.eventId);
  } catch {
    // Silencioso
  }
}
