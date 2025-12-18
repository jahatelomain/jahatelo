/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en kilómetros
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Filtra moteles por distancia desde una ubicación
 * @param {Array} motels - Lista de moteles
 * @param {number} userLat - Latitud del usuario
 * @param {number} userLon - Longitud del usuario
 * @param {number} maxDistance - Distancia máxima en kilómetros (default: 10)
 * @returns {Array} Moteles filtrados y ordenados por distancia
 */
export function filterMotelsByDistance(motels, userLat, userLon, maxDistance = 10) {
  console.log(`🔍 Filtrando ${motels.length} moteles cerca de [${userLat}, ${userLon}] - radio: ${maxDistance}km`);

  const results = motels
    .map((motel, index) => {
      // Buscar coordenadas en múltiples ubicaciones posibles
      let motelLat = motel.latitude || motel.lat || motel.location?.latitude || motel.location?.lat;
      let motelLon = motel.longitude || motel.lng || motel.lon || motel.location?.longitude || motel.location?.lng;

      // Normalizar a números (por si vienen como strings)
      motelLat = motelLat !== null && motelLat !== undefined ? parseFloat(motelLat) : null;
      motelLon = motelLon !== null && motelLon !== undefined ? parseFloat(motelLon) : null;

      // Validar que son números válidos
      if (!motelLat || !motelLon || isNaN(motelLat) || isNaN(motelLon)) {
        if (index < 3) { // Solo logear los primeros 3 para no saturar
          console.log(`⚠️ Motel "${motel.nombre}" sin coordenadas válidas:`, {
            lat: motelLat,
            lon: motelLon,
            rawLat: motel.latitude || motel.lat,
            rawLon: motel.longitude || motel.lng
          });
        }
        return null;
      }

      const distance = calculateDistance(userLat, userLon, motelLat, motelLon);

      if (index < 3) { // Log de los primeros 3 moteles procesados
        console.log(`✓ Motel "${motel.nombre}": ${distance.toFixed(1)}km - [${motelLat}, ${motelLon}]`);
      }

      return {
        ...motel,
        distance: distance.toFixed(1)
      };
    })
    .filter(motel => {
      if (motel === null) return false;
      const dist = parseFloat(motel.distance);
      return !isNaN(dist) && dist <= maxDistance;
    })
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  console.log(`✅ Encontrados ${results.length} moteles dentro de ${maxDistance}km`);

  return results;
}
