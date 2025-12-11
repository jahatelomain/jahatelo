// API Client para consumir el backend de Jahatelo

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
    tienePromo: apiMotel.hasPromo || false,
    location: apiMotel.location || null,
    photos: apiMotel.photos || [],
    thumbnail: apiMotel.thumbnail || null,
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
 * @returns {Promise<Array>} Array de moteles
 */
export const fetchMotels = async (params = {}) => {
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

  const response = await fetchJson(url);
  return response.data.map(mapMotelSummary);
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
 * @returns {Promise<Object>} Motel completo
 */
export const fetchMotelBySlug = async (slugOrId) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/motels/${slugOrId}`;

  const apiMotel = await fetchJson(url);
  return mapMotelDetail(apiMotel);
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
