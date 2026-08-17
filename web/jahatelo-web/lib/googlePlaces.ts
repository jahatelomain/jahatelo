/**
 * Resolución server-side de la ficha oficial de Google Maps.
 *
 * No usamos las coordenadas incluidas en un iframe: esas coordenadas pueden
 * representar el centro de la vista y no el pin del establecimiento.
 */

export type OfficialGooglePlace = {
  id: string;
  name: string;
  formattedAddress: string | null;
  latitude: number;
  longitude: number;
  googleMapsUri: string | null;
};

type PlacesTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    googleMapsUri?: string;
  }>;
  error?: { message?: string };
};

export type PlaceLookupInput = {
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bmotel\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasNameMatch(queryName: string, resultName: string): boolean {
  const expected = normalize(queryName).split(' ').filter((token) => token.length > 1);
  const received = new Set(normalize(resultName).split(' ').filter(Boolean));
  if (!expected.length || !received.size) return false;
  const matches = expected.filter((token) => received.has(token)).length;
  return matches / expected.length >= 0.6;
}

/**
 * Obtiene el pin canónico de una ficha de Google. La clave se mantiene sólo en
 * servidor y debe tener habilitada Places API (New).
 */
export async function findOfficialGooglePlace(input: PlaceLookupInput): Promise<OfficialGooglePlace | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY no está configurada para resolver pines oficiales.');
    return null;
  }

  const textQuery = [input.name, input.address, input.city, input.country || 'Paraguay']
    .filter((value): value is string => Boolean(value?.trim()))
    .join(', ');

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri',
      },
      body: JSON.stringify({ textQuery, languageCode: 'es', regionCode: 'PY', maxResultCount: 5 }),
      cache: 'no-store',
    });

    const data = (await response.json()) as PlacesTextSearchResponse;
    if (!response.ok) {
      console.error('No se pudo resolver la ficha oficial de Google:', data.error?.message || response.status);
      return null;
    }

    const place = data.places?.find((candidate) => {
      const latitude = candidate.location?.latitude;
      const longitude = candidate.location?.longitude;
      return Boolean(
        candidate.id &&
        candidate.displayName?.text &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        hasNameMatch(input.name, candidate.displayName.text),
      );
    });

    if (!place?.id || !place.displayName?.text || !place.location) return null;
    return {
      id: place.id,
      name: place.displayName.text,
      formattedAddress: place.formattedAddress || null,
      latitude: place.location.latitude!,
      longitude: place.location.longitude!,
      googleMapsUri: place.googleMapsUri || null,
    };
  } catch (error) {
    console.error('Error al consultar Places API:', error);
    return null;
  }
}
