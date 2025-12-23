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
    console.error('Fetch error:', error);
    throw error;
  }
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
  const normalizedPhotos = Array.isArray(apiMotel.photos) && apiMotel.photos.length > 0
    ? apiMotel.photos
    : (Array.isArray(apiMotel.allPhotos) ? apiMotel.allPhotos.slice(0, 3) : []);

  const thumbnail =
    apiMotel.thumbnail ||
    apiMotel.featuredPhoto ||
    normalizedPhotos[0] ||
    null;

  return {
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
    // Coordenadas en el nivel raíz para fácil acceso
    latitude,
    longitude,
    // También mantener el objeto location para compatibilidad
    location: (latitude !== null && longitude !== null)
      ? { lat: latitude, lng: longitude }
      : null,
    photos: normalizedPhotos,
    thumbnail,
  };
};

/**
 * Mapea un motel detallado del API al formato completo
 */
const mapMotelDetail = (apiMotel) => {
  const summary = mapMotelSummary(apiMotel);

  return {
    ...summary,
    description: apiMotel.description,
    contact: apiMotel.contact || {},
    schedules: apiMotel.schedules || [],
    rooms: apiMotel.rooms?.map(mapRoom) || [],
    menu: apiMotel.menu?.map(mapMenuCategory) || [],
    paymentMethods: apiMotel.paymentMethods || [],
    allPhotos: apiMotel.allPhotos || apiMotel.photos || [],
    hasPhotos: apiMotel.hasPhotos || false,
    promos: apiMotel.promos || [],
  };
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
      console.log('✅ Usando moteles del caché');
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
    console.log('⚠️ Error al obtener moteles, intentando caché...');
    const cached = await getCachedMotelsList();
    if (cached) {
      console.log('✅ Usando moteles del caché (offline)');
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
 * Obtiene el detalle de un motel por slug o ID
 * @param {string} slugOrId - Slug o ID del motel
 * @param {boolean} useCache - Si debe intentar usar el caché (default: true)
 * @returns {Promise<Object>} Motel completo
 */
export const fetchMotelBySlug = async (slugOrId, useCache = true) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/motels/${slugOrId}`;

  // Intentar obtener del caché primero
  if (useCache) {
    const cached = await getCachedMotelDetail(slugOrId);
    if (cached) {
      console.log(`✅ Usando detalle de motel del caché: ${slugOrId}`);
      return cached;
    }
  }

  try {
    const apiMotel = await fetchJson(url);
    const motelDetail = mapMotelDetail(apiMotel);

    // Cachear el detalle
    await cacheMotelDetail(slugOrId, motelDetail);

    // Agregar a vistos recientemente (formato resumido)
    await addToRecentViews({
      id: motelDetail.id,
      slug: motelDetail.slug,
      nombre: motelDetail.nombre,
      barrio: motelDetail.barrio,
      ciudad: motelDetail.ciudad,
      precioDesde: motelDetail.precioDesde,
      rating: motelDetail.rating,
      thumbnail: motelDetail.thumbnail,
      photos: motelDetail.photos || [],
    });

    return motelDetail;
  } catch (error) {
    // Si falla el fetch, intentar devolver del caché
    console.log(`⚠️ Error al obtener motel ${slugOrId}, intentando caché...`);
    const cached = await getCachedMotelDetail(slugOrId);
    if (cached) {
      console.log(`✅ Usando detalle de motel del caché (offline): ${slugOrId}`);
      return cached;
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
