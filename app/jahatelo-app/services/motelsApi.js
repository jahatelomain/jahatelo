// API Client para consumir el backend de Jahatelo
import {
  cacheMotelsList,
  getCachedMotelsList,
  cacheMotelDetail,
  getCachedMotelDetail,
  addToRecentViews,
  updateLastSync,
} from './cacheService';

/**
 * Obtiene la URL base del API desde las variables de entorno
 */
export const getApiBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  return `${apiUrl}/api/mobile`;
};

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

/**
 * Utilidad para hacer fetch con manejo de errores
 */
const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    debugLog('Fetch error:', error);
    throw error;
  }
};

/**
 * Normaliza una lista de fotos provenientes del backend para que siempre sean strings (URLs)
 */
const normalizePhotoList = (photos = []) => {
  if (!Array.isArray(photos)) return [];

  return photos
    .map((photo) => {
      if (!photo) return null;
      if (typeof photo === 'string') return photo;
      if (typeof photo === 'object') {
        return photo.url || photo.photoUrl || null;
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Garantiza que un objeto motel tenga siempre fotos/thumbnail en formato string
 */
const normalizeMotelPhotos = (motel = {}) => {
  if (!motel) return motel;

  const normalizedPhotos = normalizePhotoList(motel.photos);
  const normalizedAllPhotos = normalizePhotoList(motel.allPhotos);
  const featured = motel.featuredPhoto ? [motel.featuredPhoto] : [];

  const buildUniqueList = (lists) => {
    const merged = lists.flat().filter(Boolean);
    return Array.from(new Set(merged));
  };

  let effectivePhotos = buildUniqueList([featured, normalizedPhotos]);
  if (effectivePhotos.length === 0) {
    effectivePhotos = buildUniqueList([featured, normalizedAllPhotos]);
  }

  let effectiveAllPhotos = buildUniqueList([featured, normalizedAllPhotos]);
  if (effectiveAllPhotos.length === 0) {
    effectiveAllPhotos = buildUniqueList([featured, normalizedPhotos]);
  }

  const normalizedThumbnail =
    typeof motel.thumbnail === 'string'
      ? motel.thumbnail
      : motel.thumbnail?.url || motel.thumbnail?.photoUrl || effectivePhotos[0] || effectiveAllPhotos[0] || null;

  return {
    ...motel,
    photos: effectivePhotos,
    allPhotos: effectiveAllPhotos,
    thumbnail: normalizedThumbnail,
  };
};

/**
 * Mapea un motel del API al formato que usan los componentes
 */
const mapMotelSummary = (apiMotel) => {
  // Extraer coordenadas del backend (pueden venir como latitude/longitude o en objeto location)
  const lat = apiMotel.latitude || apiMotel.location?.lat || apiMotel.location?.latitude || null;
  const lng = apiMotel.longitude || apiMotel.location?.lng || apiMotel.location?.longitude || null;

  // Normalizar a números (por si vienen como strings)
  const latitude = lat !== null ? parseFloat(lat) : null;
  const longitude = lng !== null ? parseFloat(lng) : null;

  // Normalizar fotos: siempre una lista de strings para reutilizar en la app
  let normalizedPhotos = normalizePhotoList(apiMotel.photos);
  if (normalizedPhotos.length === 0 && Array.isArray(apiMotel.allPhotos)) {
    normalizedPhotos = normalizePhotoList(apiMotel.allPhotos).slice(0, 3);
  }

  const thumbnail =
    apiMotel.thumbnail ||
    apiMotel.featuredPhoto ||
    normalizedPhotos[0] ||
    null;

  return normalizeMotelPhotos({
    id: apiMotel.id,
    slug: apiMotel.slug,
    nombre: apiMotel.name,
    barrio: apiMotel.neighborhood,
    ciudad: apiMotel.city,
    distanciaKm: null, // El API no devuelve distancia por ahora
    precioDesde: apiMotel.startingPrice || 0,
    amenities: apiMotel.amenities || [],
    rating: apiMotel.rating?.average || 0,
    isFeatured: apiMotel.isFeatured || false,
    tienePromo: typeof apiMotel.tienePromo === 'boolean' ? apiMotel.tienePromo : (apiMotel.hasPromo || false),
    plan: apiMotel.plan || 'BASIC',
    // Coordenadas en el nivel raíz para fácil acceso
    latitude,
    longitude,
    // También mantener el objeto location para compatibilidad
    location: (latitude !== null && longitude !== null)
      ? { lat: latitude, lng: longitude }
      : null,
    photos: normalizedPhotos,
    thumbnail,
  });
};

/**
 * Mapea un motel detallado del API al formato completo
 */
const mapMotelDetail = (apiMotel) => {
  const summary = mapMotelSummary(apiMotel);

  return normalizeMotelPhotos({
    ...summary,
    description: apiMotel.description,
    contact: apiMotel.contact || {},
    schedules: apiMotel.schedules || [],
    rooms: apiMotel.rooms?.map(mapRoom) || [],
    menu: apiMotel.menu?.map(mapMenuCategory) || [],
    paymentMethods: apiMotel.paymentMethods || [],
    allPhotos: normalizePhotoList(apiMotel.allPhotos || apiMotel.photos),
    hasPhotos: apiMotel.hasPhotos || false,
    promos: apiMotel.promos || [],
  });
};

/**
 * Mapea una habitación del API
 */
const mapRoom = (apiRoom) => {
  return {
    id: apiRoom.id,
    name: apiRoom.name,
    description: apiRoom.description,
    basePrice: apiRoom.basePrice || 0,
    priceLabel: apiRoom.priceLabel || `Desde $${(apiRoom.basePrice || 0).toLocaleString('es-PY')}`,
    prices: apiRoom.prices || {},
    amenities: apiRoom.amenities || [],
    photos: apiRoom.photos || [],
    maxPersons: apiRoom.maxPersons,
    hasJacuzzi: apiRoom.hasJacuzzi || false,
    hasPrivateGarage: apiRoom.hasPrivateGarage || false,
    isFeatured: apiRoom.isFeatured || false,
  };
};

/**
 * Mapea una categoría de menú del API
 */
const mapMenuCategory = (apiCategory) => {
  return {
    id: apiCategory.id,
    title: apiCategory.name,
    items: apiCategory.items?.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      photoUrl: item.photoUrl,
    })) || [],
  };
};

/**
 * Obtiene moteles con parámetros opcionales
 * @param {Object} params - Parámetros de búsqueda/filtro
 * @param {boolean} useCache - Si debe intentar usar el caché (default: true)
 * @returns {Promise<Array>} Array de moteles
 */
export const fetchMotels = async (params = {}, useCache = true) => {
  const baseUrl = getApiBaseUrl();
  const queryParams = new URLSearchParams();

  // Agregar parámetros si existen
  if (params.search) queryParams.append('search', params.search);
  if (params.city) queryParams.append('city', params.city);
  if (params.neighborhood) queryParams.append('neighborhood', params.neighborhood);
  if (params.amenity) queryParams.append('amenity', params.amenity);
  if (params.featured !== undefined) queryParams.append('featured', params.featured);
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `${baseUrl}/motels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  // Si no hay filtros y useCache es true, intentar obtener del caché primero
  const hasFilters = Object.keys(params).length > 0;
  if (!hasFilters && useCache) {
    const cached = await getCachedMotelsList();
    if (cached) {
      debugLog('✅ Usando moteles del caché');
      return cached;
    }
  }

  try {
    const response = await fetchJson(url);
    const motels = response.data.map(mapMotelSummary);

    // Cachear solo si no hay filtros
    if (!hasFilters) {
      await cacheMotelsList(motels);
      await updateLastSync();
    }

    return motels;
  } catch (error) {
    // Si falla el fetch, intentar devolver del caché
    debugLog('⚠️ Error al obtener moteles, intentando caché...');
    const cached = await getCachedMotelsList();
    if (cached) {
      debugLog('✅ Usando moteles del caché (offline)');
      return cached;
    }
    throw error;
  }
};

/**
 * Obtiene moteles destacados
 * @returns {Promise<Array>} Array de moteles destacados
 */
export const fetchFeaturedMotels = async () => {
  return fetchMotels({ featured: true });
};

/**
 * Obtiene moteles con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Array>} Array de moteles filtrados
 */
export const fetchMotelsByFilters = async ({ search, amenity, city }) => {
  const params = {};
  if (search) params.search = search;
  if (amenity) params.amenity = amenity;
  if (city) params.city = city;

  return fetchMotels(params);
};

/**
 * Obtiene ciudades disponibles para el selector
 * @returns {Promise<Array>} Array de ciudades con count
 */
export const fetchCities = async () => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/cities`;

  const response = await fetchJson(url);
  return response.cities || [];
};

/**
 * Obtiene el detalle de un motel por slug o ID
 * @param {string} slugOrId - Slug o ID del motel
 * @param {boolean} useCache - Si debe intentar usar el caché (default: true)
 * @returns {Promise<Object>} Motel completo
 */
export const fetchMotelBySlug = async (slugOrId, useCache = true) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/motels/${slugOrId}`;

  let cachedDetail = null;
  if (useCache) {
    const cached = await getCachedMotelDetail(slugOrId);
    if (cached) {
      cachedDetail = normalizeMotelPhotos(cached);
    }
  }

  try {
    const apiMotel = await fetchJson(url);
    const motelDetail = mapMotelDetail(apiMotel);
    const normalizedDetail = normalizeMotelPhotos(motelDetail);

    // Cachear el detalle
    await cacheMotelDetail(slugOrId, normalizedDetail);

    // Agregar a vistos recientemente (formato resumido)
    await addToRecentViews({
      id: normalizedDetail.id,
      slug: normalizedDetail.slug,
      nombre: normalizedDetail.nombre,
      barrio: normalizedDetail.barrio,
      ciudad: normalizedDetail.ciudad,
      precioDesde: normalizedDetail.precioDesde,
      rating: normalizedDetail.rating,
      thumbnail: normalizedDetail.thumbnail,
      photos: normalizedDetail.photos || [],
    });

    return normalizedDetail;
  } catch (error) {
    // Si falla el fetch, intentar devolver del caché
    debugLog(`⚠️ Error al obtener motel ${slugOrId}, intentando caché...`);
    if (cachedDetail) {
      debugLog(`✅ Usando detalle de motel del caché (offline): ${slugOrId}`);
      return cachedDetail;
    }
    throw error;
  }
};

/**
 * Busca y filtra moteles combinando texto y amenity
 * @param {string} query - Texto de búsqueda
 * @param {string} amenity - Amenity a filtrar
 * @returns {Promise<Array>} Array de moteles que cumplen criterios
 */
export const searchAndFilterMotels = async (query, amenity) => {
  const params = {};
  if (query) params.search = query;
  if (amenity) params.amenity = amenity;

  return fetchMotels(params);
};

/**
 * Formatea el precio en guaraníes
 * @param {number} precio - Precio en guaraníes
 * @returns {string} Precio formateado
 */
export const formatPrice = (precio) => {
  if (!precio) return 'Consultar';
  return `Gs ${precio.toLocaleString('es-PY')}`;
};

/**
 * Formatea la distancia
 * @param {number} km - Distancia en kilómetros
 * @returns {string} Distancia formateada
 */
export const formatDistance = (km) => {
  if (km === null || km === undefined) return '';
  return `a ${km.toFixed(1)} km`;
};
