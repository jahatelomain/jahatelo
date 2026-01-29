/**
 * Script para extraer moteles de Google Places API (New)
 * Uso: node scripts/scrape-motels-google.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ Error: GOOGLE_MAPS_API_KEY no está configurada');
  console.log('💡 Configura tu API key:');
  console.log('   export GOOGLE_MAPS_API_KEY="tu_api_key_aqui"');
  console.log('   O crea un archivo .env con: GOOGLE_MAPS_API_KEY=tu_api_key');
  console.log('\n📚 Obtén tu API key en: https://console.cloud.google.com/google/maps-apis');
  process.exit(1);
}

// Ciudades principales de Paraguay
const CITIES_PARAGUAY = [
  { name: 'Asunción', lat: -25.2637, lng: -57.5759 },
  { name: 'Ciudad del Este', lat: -25.5095, lng: -54.6116 },
  { name: 'San Lorenzo', lat: -25.3400, lng: -57.5089 },
  { name: 'Luque', lat: -25.2667, lng: -57.4833 },
  { name: 'Capiatá', lat: -25.3558, lng: -57.4458 },
  { name: 'Lambaré', lat: -25.3420, lng: -57.6050 },
  { name: 'Fernando de la Mora', lat: -25.3189, lng: -57.5392 },
  { name: 'Limpio', lat: -25.1667, lng: -57.4833 },
  { name: 'Ñemby', lat: -25.3947, lng: -57.5378 },
  { name: 'Encarnación', lat: -27.3378, lng: -55.8658 },
  { name: 'Mariano Roque Alonso', lat: -25.2167, lng: -57.5333 },
  { name: 'Pedro Juan Caballero', lat: -22.5489, lng: -55.7322 },
  { name: 'Itauguá', lat: -25.3939, lng: -57.3558 },
  { name: 'Villa Elisa', lat: -25.3667, lng: -57.5833 },
  { name: 'San Antonio', lat: -25.4000, lng: -57.5667 },
  { name: 'Caaguazú', lat: -25.4689, lng: -56.0139 },
  { name: 'Coronel Oviedo', lat: -25.4500, lng: -56.4333 },
  { name: 'Concepción', lat: -23.4067, lng: -57.4344 },
  { name: 'Villarrica', lat: -25.7500, lng: -56.4333 },
  { name: 'Itá', lat: -25.5000, lng: -57.3667 },
  { name: 'Areguá', lat: -25.3108, lng: -57.4089 },
  { name: 'Ypacaraí', lat: -25.4000, lng: -57.2833 },
  { name: 'Paraguarí', lat: -25.6300, lng: -57.1500 },
];

// Términos de búsqueda
const SEARCH_TERMS = ['motel', 'hotel alojamiento', 'hospedaje', 'apart hotel'];

// Delay entre requests para no exceder rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Buscar lugares en Google Places API (New)
 */
async function searchPlaces(city, searchTerm) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
    'X-Goog-FieldMask': [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.regularOpeningHours',
      'places.types',
      'places.priceLevel',
      'places.googleMapsUri',
      'places.photos'
    ].join(',')
  };

  const body = {
    textQuery: `${searchTerm} en ${city.name}, Paraguay`,
    languageCode: 'es',
    locationBias: {
      circle: {
        center: { latitude: city.lat, longitude: city.lng },
        radius: 15000
      }
    },
    maxResultCount: 20
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
      console.error(`⚠️  Error en ${city.name}: ${data.error?.message || 'Unknown error'}`);
      return [];
    }

    return data.places || [];
  } catch (error) {
    console.error(`❌ Error fetching ${city.name}:`, error.message);
    return [];
  }
}

/**
 * Procesar y formatear datos de motel
 */
function formatMotelData(place, city) {
  return {
    // Información básica
    googlePlaceId: place.id,
    name: place.displayName?.text || '',
    city: city.name,

    // Ubicación
    address: place.formattedAddress || null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,

    // Contacto
    phone: place.nationalPhoneNumber || null,
    internationalPhone: place.internationalPhoneNumber || null,
    website: place.websiteUri || null,

    // Rating
    rating: place.rating || null,
    totalRatings: place.userRatingCount || 0,

    // Horarios
    openNow: place.regularOpeningHours?.openNow ?? null,
    openingHours: place.regularOpeningHours?.weekdayDescriptions || null,

    // Metadata
    types: place.types || [],
    priceLevel: place.priceLevel || null,

    // URLs
    googleMapsUrl: place.googleMapsUri || null,

    // Fotos (solo referencias/ids)
    photoReferences: place.photos?.slice(0, 5).map(p => p.name) || [],

    // Timestamp
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando scraping de moteles de Paraguay desde Google Maps\n');

  const allMotels = [];
  const seenPlaceIds = new Set();
  let totalFound = 0;

  for (const city of CITIES_PARAGUAY) {
    console.log(`\n📍 Buscando en ${city.name}...`);

    for (const term of SEARCH_TERMS) {
      console.log(`   🔍 Término: "${term}"`);

      const places = await searchPlaces(city, term);
      console.log(`      Encontrados: ${places.length} lugares`);

      for (const place of places) {
        // Evitar duplicados
        if (seenPlaceIds.has(place.id)) {
          continue;
        }

        seenPlaceIds.add(place.id);
        totalFound++;

        console.log(`      📄 ${totalFound}. ${place.displayName?.text || 'Sin nombre'}`);

        // Formatear y guardar
        const motelData = formatMotelData(place, city);
        allMotels.push(motelData);

        // Delay para respetar rate limits
        await delay(100);
      }

      // Delay entre búsquedas
      await delay(500);
    }
  }

  console.log(`\n✅ Scraping completado!`);
  console.log(`📊 Total de moteles únicos encontrados: ${allMotels.length}`);

  // Crear directorio de salida
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Guardar como JSON
  const jsonPath = path.join(outputDir, 'motels-paraguay-google.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allMotels, null, 2));
  console.log(`\n💾 Guardado JSON: ${jsonPath}`);

  // Guardar como CSV
  const csvPath = path.join(outputDir, 'motels-paraguay-google.csv');
  const csvContent = convertToCSV(allMotels);
  fs.writeFileSync(csvPath, csvContent);
  console.log(`💾 Guardado CSV: ${csvPath}`);

  // Estadísticas
  console.log('\n📈 Estadísticas:');
  const cityCounts = {};
  allMotels.forEach(m => {
    cityCounts[m.city] = (cityCounts[m.city] || 0) + 1;
  });

  Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count} moteles`);
    });

  console.log(`\n✨ ¡Listo! Archivos generados en: ${outputDir}`);
}

/**
 * Convertir a CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = [
    'name',
    'city',
    'address',
    'phone',
    'website',
    'rating',
    'totalRatings',
    'latitude',
    'longitude',
    'googlePlaceId',
    'googleMapsUrl',
    'openNow',
    'scrapedAt'
  ];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(item =>
    headers.map(header => escapeCSV(item[header])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
