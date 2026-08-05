import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre', description: 'Descripcion', country: 'Pais', city: 'Ciudad',
  latitude: 'Latitud', longitude: 'Longitud', phone: 'Telefono', whatsapp: 'WhatsApp',
  website: 'Sitio web', instagram: 'Instagram', contactName: 'Contacto usuarios',
  contactEmail: 'Correo usuarios', contactPhone: 'Telefono usuarios',
  adminContactName: 'Contacto administrativo', adminContactEmail: 'Correo administrativo',
  adminContactPhone: 'Telefono administrativo', operationsContactName: 'Contacto operativo',
  operationsContactEmail: 'Correo operativo', operationsContactPhone: 'Telefono operativo',
  featuredPhoto: 'URL foto principal', featuredPhotoWeb: 'URL foto principal (Web)',
  featuredPhotoApp: 'URL foto principal (App)', nextBillingAt: 'Proxima facturacion',
  status: 'Estado', isActive: 'Habilitado',
};

export const normalizeOptionalText = (value: string) => value.trim() || null;

export const normalizeUploadUrl = (value: string | null) => {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('/uploads/')) return trimmed;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?\//.test(trimmed);
  if (isLocal) return trimmed.match(/\/uploads\/.+$/)?.[0] || normalizeLocalUrl(trimmed);
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return normalizeLocalUrl(trimmed);
};

export const normalizeMapUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.toLowerCase().startsWith('<iframe')) return trimmed;
  return trimmed.match(/src=["']([^"']+)["']/i)?.[1] || trimmed;
};

export const extractLatLngFromMapUrl = (value: string | null) => {
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => [string, string]]> = [
    [/!3d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/, (match) => [match[1], match[2]]],
    [/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/, (match) => [match[2], match[1]]],
    [/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, (match) => [match[1], match[2]]],
    [/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, (match) => [match[1], match[2]]],
    [/[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, (match) => [match[1], match[2]]],
    [/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, (match) => [match[1], match[2]]],
  ];
  for (const [regex, read] of patterns) {
    const match = decoded.match(regex);
    if (!match) continue;
    const [lat, lng] = read(match).map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
  }
  return null;
};

/**
 * Obtiene el CID de la ficha de Google Maps desde un enlace compartido o un
 * iframe de Google Maps Embed. El CID identifica el negocio, mientras que las
 * coordenadas solo apuntan a una posición aproximada del mapa.
 */
export const extractGoogleMapsCid = (value: string | null) => {
  if (!value) return null;

  try {
    const normalized = normalizeMapUrl(value) || value;
    const decoded = decodeURIComponent(normalized);
    const directCid = decoded.match(/[?&]cid=(\d+)/i)?.[1];
    if (directCid) return directCid;

    // Los iframes Embed incluyen el feature id como !1s0x...:0x<CID_HEX>.
    const cidHex = decoded.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i)?.[1];
    if (!cidHex || typeof BigInt !== 'function') return null;

    return BigInt(`0x${cidHex}`).toString(10);
  } catch {
    return null;
  }
};

/**
 * Convierte un src de Google Maps Embed en un enlace que puede abrirse fuera
 * de un iframe. Google rechaza abrir directamente las URLs `/maps/embed`.
 */
export const getGoogleMapsExternalUrl = (value: string | null, fallbackQuery = '') => {
  if (!value) return null;

  const cid = extractGoogleMapsCid(value);
  if (cid) return `https://www.google.com/maps?cid=${cid}`;

  const coordinates = extractLatLngFromMapUrl(value);
  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  }

  const isEmbedUrl = /google\.[^/]+\/maps\/embed|\/maps\/embed/i.test(value);
  if (isEmbedUrl && fallbackQuery.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery.trim())}`;
  }

  return isEmbedUrl ? null : value;
};

export const getResponseError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (Array.isArray(data?.details) && data.details.length > 0) {
      const messages = data.details.map((detail: { field?: string; message?: string }) =>
        `${detail.field ? FIELD_LABELS[detail.field] || detail.field : 'Campo'}: ${detail.message || 'Dato invalido'}`,
      ).join('\n');
      return `${data.error || data.message || 'Datos invalidos'}:\n${messages}`;
    }
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
};
