/**
 * Geocoding service using Google Maps Geocoding API
 *
 * Requires GOOGLE_MAPS_API_KEY in environment variables
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

interface GoogleGeocodeResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address Full address string
 * @param city City name
 * @param country Country name (default: Paraguay)
 * @returns Coordinates and formatted address
 */
export async function geocodeAddress(
  address: string,
  city: string,
  country: string = 'Paraguay'
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not configured');
    throw new Error('Google Maps API key not configured');
  }

  try {
    // Build full address string
    const fullAddress = `${address}, ${city}, ${country}`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data: GoogleGeocodeResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocode results for address: ${fullAddress}`);
      return null;
    } else {
      console.error(`Geocoding failed with status: ${data.status}`);
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Geocode multiple addresses with rate limiting
 * @param addresses Array of address objects
 * @param delayMs Delay between requests in milliseconds (default: 200ms)
 * @returns Array of geocode results
 */
export async function geocodeMultipleAddresses(
  addresses: Array<{ address: string; city: string; country?: string }>,
  delayMs: number = 200
): Promise<Array<GeocodeResult | null>> {
  const results: Array<GeocodeResult | null> = [];

  for (const addr of addresses) {
    try {
      const result = await geocodeAddress(addr.address, addr.city, addr.country);
      results.push(result);

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to geocode: ${addr.address}, ${addr.city}`, error);
      results.push(null);
    }
  }

  return results;
}
