/**
 * Extrae coordenadas (latitud, longitud) de diferentes formatos de URLs de Google Maps
 *
 * Soporta formatos:
 * - https://maps.google.com/?q=-25.2637,-57.5759
 * - https://www.google.com/maps/@-25.2637,-57.5759,15z
 * - https://www.google.com/maps/place/Location/@-25.2637,-57.5759
 * - https://goo.gl/maps/... (requiere seguir redirect manualmente)
 * - https://maps.app.goo.gl/... (nuevo formato de Google)
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Extrae coordenadas de una URL de Google Maps
 * @param url - URL de Google Maps (cualquier formato)
 * @returns Objeto con lat y lng, o null si no se pueden extraer
 */
export function extractCoordinatesFromGoogleMapsUrl(url: string): Coordinates | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Formato 1: ?q=-25.2637,-57.5759
    const coordsMatch1 = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordsMatch1) {
      const lat = parseFloat(coordsMatch1[1]);
      const lng = parseFloat(coordsMatch1[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Formato 2: @-25.2637,-57.5759,15z o @-25.2637,-57.5759
    const coordsMatch2 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,\d+\.?\d*z)?/);
    if (coordsMatch2) {
      const lat = parseFloat(coordsMatch2[1]);
      const lng = parseFloat(coordsMatch2[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Formato 3: /place/Name/@-25.2637,-57.5759
    const coordsMatch3 = url.match(/\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordsMatch3) {
      const lat = parseFloat(coordsMatch3[1]);
      const lng = parseFloat(coordsMatch3[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Formato 4: ll=-25.2637,-57.5759 (algunos links antiguos)
    const coordsMatch4 = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordsMatch4) {
      const lat = parseFloat(coordsMatch4[1]);
      const lng = parseFloat(coordsMatch4[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // No se pudo extraer
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
}

/**
 * Valida que las coordenadas sean válidas geográficamente
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns true si las coordenadas son válidas
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Valida específicamente que las coordenadas estén en Paraguay
 * Paraguay está aproximadamente entre:
 * - Latitud: -27.6 a -19.3
 * - Longitud: -62.6 a -54.3
 *
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns true si las coordenadas están dentro de Paraguay
 */
export function isInParaguay(lat: number, lng: number): boolean {
  return (
    lat >= -27.6 &&
    lat <= -19.3 &&
    lng >= -62.6 &&
    lng <= -54.3
  );
}

/**
 * Valida y extrae coordenadas, verificando que estén en Paraguay
 * @param url - URL de Google Maps
 * @returns Coordenadas si son válidas y están en Paraguay, null otherwise
 */
export function extractAndValidateParaguayCoordinates(url: string): Coordinates | null {
  const coords = extractCoordinatesFromGoogleMapsUrl(url);

  if (!coords) {
    return null;
  }

  if (!isInParaguay(coords.lat, coords.lng)) {
    console.warn('Coordinates are not in Paraguay:', coords);
    return null;
  }

  return coords;
}

/**
 * Formatea coordenadas para display
 * @param lat - Latitud
 * @param lng - Longitud
 * @returns String formateado "lat, lng"
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
