/**
 * Analytics anónimo para web
 * Genera un UUID por browser, lo persiste en cookie y envía eventos al backend.
 * No requiere registro ni permisos del usuario.
 */

const DEVICE_ID_KEY = 'jhtl_did';
const COOKIE_DAYS = 730; // 2 años

function generateUUID(): string {
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
    id = generateUUID();
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
  | 'map_view';

interface TrackOptions {
  event: VisitorEventType;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

export async function trackVisitor(opts: TrackOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;

  try {
    await fetch('/api/analytics/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        platform: 'web',
        event: opts.event,
        path: opts.path,
        referrer: opts.referrer ?? document.referrer ?? undefined,
        metadata: opts.metadata,
      }),
      // keepalive para que el request no se corte si el usuario navega
      keepalive: true,
    });
  } catch {
    // Silencioso
  }
}
