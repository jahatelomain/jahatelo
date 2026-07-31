// API Client para consumir el backend de Jahatelo
import {
  cacheMotelsList,
  getCachedMotelsList,
  cacheMotelDetail,
  getCachedMotelDetail,
  clearMotelDetailCaches,
  addToRecentViews,
  updateLastSync,
} from './cacheService';
import { getMobileApiBase } from './apiBaseUrl';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

/**
 * Obtiene la URL base del API desde las variables de entorno
 */
export const getApiBaseUrl = () => {
  return getMobileApiBase();
};

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

/**
 * Alias para mantener compatibilidad con código existente
 */
const fetchJson = fetchWithTimeout;

/**
 * Descarta amenities eliminados o incompletos que el API pueda devolver como null.
 * Conserva tanto el formato string legado como los objetos con nombre.
 */
const normalizeAmenityList = (amenities = []) => {
  if (!Array.isArray(amenities)) return [];

  return amenities.filter((amenity) => {
    if (typeof amenity === 'string') return amenity.trim().length > 0;
    return Boolean(amenity && typeof amenity === 'object' && amenity.name);
  });
};

/**
 * Garantiza que la portada configurada del motel sea una URL utilizable.
 */
const normalizeMotelPresentation = (motel = {}) => {
  if (!motel) return motel;

  const normalizedThumbnail =
    typeof motel.thumbnail === 'string'
      ? motel.thumbnail
      : motel.thumbnail?.url || motel.thumbnail?.photoUrl || motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto || null;

  return {
    ...motel,
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

  const thumbnail =
    apiMotel.thumbnail ||
    apiMotel.featuredPhotoApp ||
    apiMotel.featuredPhotoWeb ||
    apiMotel.featuredPhoto ||
    null;

  return normalizeMotelPresentation({
    id: apiMotel.id,
    slug: apiMotel.slug,
    nombre: apiMotel.name,
    ciudad: apiMotel.city,
    distanciaKm: null, // El API no devuelve distancia por ahora
    precioDesde: apiMotel.startingPrice || 0,
    amenities: normalizeAmenityList(apiMotel.amenities),
    rating: apiMotel.rating?.average || 0,
    isFeatured: apiMotel.isFeatured || false,
    tienePromo: typeof apiMotel.tienePromo === 'boolean' ? apiMotel.tienePromo : (apiMotel.hasPromo || false),
    promoImageUrl: apiMotel.promoImageUrl || null,
    promoTitle: apiMotel.promoTitle || null,
    promoDescription: apiMotel.promoDescription || null,
    plan: apiMotel.plan || 'BASIC',
    // Coordenadas en el nivel raíz para fácil acceso
    latitude,
    longitude,
    // También mantener el objeto location para compatibilidad
    location: (latitude !== null && longitude !== null)
      ? { lat: latitude, lng: longitude }
      : null,
    thumbnail,
    featuredPhotoApp: apiMotel.featuredPhotoApp || null,
    featuredPhotoWeb: apiMotel.featuredPhotoWeb || null,
  });
};

/**
 * Mapea un motel detallado del API al formato completo
 */
const mapMotelDetail = (apiMotel) => {
  const summary = mapMotelSummary(apiMotel);

  return normalizeMotelPresentation({
    ...summary,
    address: apiMotel.address || null,
    description: apiMotel.description || null,
    contact: apiMotel.contact || {},
    schedules: apiMotel.schedules || [],
    rooms: apiMotel.rooms?.filter(Boolean).map(mapRoom) || [],
    menu: apiMotel.menu?.map(mapMenuCategory) || [],
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
    prices: apiRoom.prices || {},
    dayRates: apiRoom.dayRates || [],
    amenities: normalizeAmenityList(apiRoom.amenities),
    photos: apiRoom.photos || [],
    maxPersons: apiRoom.maxPersons,
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
export const fetchMotels = async (params = {}, useCache = true, requestOptions = {}) => {
  const baseUrl = getApiBaseUrl();
  const queryParams = new URLSearchParams();

  // Agregar parámetros si existen
  if (params.search) queryParams.append('search', params.search);
  if (params.city) queryParams.append('city', params.city);
  if (params.amenity) queryParams.append('amenity', params.amenity);
  if (params.featured !== undefined) queryParams.append('featured', params.featured);
  if (params.promos !== undefined) queryParams.append('promos', params.promos);
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `${baseUrl}/motels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  // Si no hay filtros y useCache es true, intentar obtener del caché primero
  // En desarrollo deshabilitamos caché para ver cambios al instante.
  const hasFilters = Object.keys(params).length > 0;
  const cacheStorageEnabled = !__DEV__ && process.env.EXPO_PUBLIC_DISABLE_CACHE !== '1';
  const cacheEnabled = useCache && cacheStorageEnabled;

  // Caché rápido: si no expiró el TTL, usar sin request al servidor
  if (!hasFilters && cacheEnabled) {
    const cachedData = await getCachedMotelsList();
    if (cachedData) {
      debugLog('✅ Usando moteles del caché');
      return cachedData.motels;
    }
  }

  try {
    const response = await fetchJson(url, requestOptions);
    const motels = response.data.map(mapMotelSummary);
    const serverUpdatedAt = response.meta?.latestUpdatedAt ?? null;

    if (!hasFilters && cacheEnabled) {
      // Si el servidor tiene datos más nuevos, limpiar detalles en caché para evitar stale data
      const prevCache = await getCachedMotelsList();
      if (prevCache?.serverUpdatedAt && serverUpdatedAt && prevCache.serverUpdatedAt !== serverUpdatedAt) {
        debugLog('🔄 Datos cambiaron en el servidor, limpiando caché de detalles');
        await clearMotelDetailCaches();
      }
      await cacheMotelsList(motels, serverUpdatedAt);
      await updateLastSync();
    }

    return motels;
  } catch (error) {
    // Si falla el fetch, intentar devolver del caché (modo offline)
    debugLog('⚠️ Error al obtener moteles, intentando caché...');
    if (cacheEnabled) {
      const cachedData = await getCachedMotelsList();
      if (cachedData) {
        debugLog('✅ Usando moteles del caché (offline)');
        return cachedData.motels;
      }
    }
    throw error;
  }
};

/**
 * Obtiene todos los moteles destacados (isFeatured=true) para el carrusel.
 * Usa limit:50 para no perder destacados que no caigan en el top-20 general.
 * @returns {Promise<Array>} Array de moteles destacados
 */
export const fetchFeaturedMotels = async () => {
  return fetchMotels({ featured: true, limit: 50 });
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

  // En desarrollo deshabilitamos caché para ver cambios al instante
  const cacheStorageEnabled = !__DEV__ && process.env.EXPO_PUBLIC_DISABLE_CACHE !== '1';
  const cacheEnabled = useCache && cacheStorageEnabled;

  // Leer el caché incluso cuando se fuerza una actualización: no se devuelve de
  // inmediato, pero sigue disponible como respaldo si el dispositivo está offline.
  const cachedItem = await getCachedMotelDetail(slugOrId);
  if (cacheEnabled) {
    if (cachedItem) {
      debugLog('✅ Usando detalle del caché:', slugOrId);
      return normalizeMotelPresentation(cachedItem.motel);
    }
  }

  try {
    const apiMotel = await fetchJson(url);
    const motelDetail = mapMotelDetail(apiMotel);
    const normalizedDetail = normalizeMotelPresentation(motelDetail);
    // updatedAt viene del servidor en la respuesta del detalle
    const serverUpdatedAt = apiMotel.updatedAt ?? null;

    if (cacheStorageEnabled) {
      await cacheMotelDetail(slugOrId, normalizedDetail, serverUpdatedAt);
    }

    // Agregar a vistos recientemente (formato resumido)
    await addToRecentViews({
      id: normalizedDetail.id,
      slug: normalizedDetail.slug,
      nombre: normalizedDetail.nombre,
      ciudad: normalizedDetail.ciudad,
      precioDesde: normalizedDetail.precioDesde,
      rating: normalizedDetail.rating,
      thumbnail: normalizedDetail.thumbnail,
      photos: normalizedDetail.photos || [],
    });

    return normalizedDetail;
  } catch (error) {
    // Si falla el fetch, intentar devolver del caché (modo offline)
    debugLog(`⚠️ Error al obtener motel ${slugOrId}, intentando caché...`);
    if (cachedItem) {
      debugLog(`✅ Usando detalle de motel del caché (offline): ${slugOrId}`);
      return normalizeMotelPresentation(cachedItem.motel);
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
export const searchAndFilterMotels = async (query, amenity, requestOptions = {}) => {
  const params = {};
  if (query) params.search = query;
  if (amenity) params.amenity = amenity;

  return fetchMotels(params, false, requestOptions);
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
