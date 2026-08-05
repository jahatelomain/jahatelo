/**
 * Convierte un enlace o iframe de Google Maps en un enlace externo.
 * Cuando el iframe identifica una ficha de Google, se usa su CID para abrir
 * exactamente ese pin. Las coordenadas quedan como respaldo.
 */
const normalizeMapUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith('<iframe')) return trimmed;
  return trimmed.match(/src=["']([^"']+)["']/i)?.[1] || trimmed;
};

const extractCoordinates = (value) => {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const match = decoded.match(/!3d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/)
      || decoded.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const latFirst = match[0].startsWith('!3d');
    const latitude = Number(latFirst ? match[1] : match[2]);
    const longitude = Number(latFirst ? match[2] : match[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
};

const extractGoogleMapsCid = (value) => {
  try {
    const normalized = normalizeMapUrl(value);
    if (!normalized) return null;
    const decoded = decodeURIComponent(normalized);
    const directCid = decoded.match(/[?&]cid=(\d+)/i)?.[1];
    if (directCid) return directCid;
    const cidHex = decoded.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i)?.[1];
    if (!cidHex || typeof BigInt !== 'function') return null;
    return BigInt(`0x${cidHex}`).toString(10);
  } catch {
    return null;
  }
};

export const getGoogleMapsExternalUrl = (value, location) => {
  const normalized = normalizeMapUrl(value);
  const cid = extractGoogleMapsCid(normalized);
  if (cid) return `https://www.google.com/maps?cid=${cid}`;

  const coordinates = extractCoordinates(normalized);
  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  }

  if (normalized && !/\/maps\/embed/i.test(normalized)) return normalized;
  if (location?.lat != null && location?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  }
  return null;
};
