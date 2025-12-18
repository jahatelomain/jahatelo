import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves de caché
const CACHE_KEYS = {
  MOTELS_LIST: '@jahatelo:motels_list',
  MOTEL_DETAIL: '@jahatelo:motel_detail_',
  RECENT_VIEWS: '@jahatelo:recent_views',
  SEARCH_HISTORY: '@jahatelo:search_history',
  LAST_SYNC: '@jahatelo:last_sync',
};

// Tiempo de expiración del caché (en milisegundos)
const CACHE_EXPIRY = {
  MOTELS_LIST: 1000 * 60 * 30, // 30 minutos
  MOTEL_DETAIL: 1000 * 60 * 60, // 1 hora
  RECENT_VIEWS: 1000 * 60 * 60 * 24 * 7, // 7 días
  SEARCH_HISTORY: 1000 * 60 * 60 * 24 * 30, // 30 días
};

/**
 * Guarda datos en caché con timestamp
 */
export const setCache = async (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    console.error('Error saving to cache:', error);
    return false;
  }
};

/**
 * Obtiene datos del caché si no han expirado
 */
export const getCache = async (key, expiryTime = CACHE_EXPIRY.MOTELS_LIST) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const now = Date.now();

    // Verificar si el caché ha expirado
    if (now - cacheItem.timestamp > expiryTime) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

/**
 * Limpia todo el caché
 */
export const clearCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const jahataloKeys = keys.filter(key => key.startsWith('@jahatelo:'));
    await AsyncStorage.multiRemove(jahataloKeys);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Guarda la lista de moteles en caché
 */
export const cacheMotelsList = async (motels) => {
  return await setCache(CACHE_KEYS.MOTELS_LIST, motels);
};

/**
 * Obtiene la lista de moteles del caché
 */
export const getCachedMotelsList = async () => {
  return await getCache(CACHE_KEYS.MOTELS_LIST, CACHE_EXPIRY.MOTELS_LIST);
};

/**
 * Guarda el detalle de un motel en caché
 */
export const cacheMotelDetail = async (motelId, motelData) => {
  const key = `${CACHE_KEYS.MOTEL_DETAIL}${motelId}`;
  return await setCache(key, motelData);
};

/**
 * Obtiene el detalle de un motel del caché
 */
export const getCachedMotelDetail = async (motelId) => {
  const key = `${CACHE_KEYS.MOTEL_DETAIL}${motelId}`;
  return await getCache(key, CACHE_EXPIRY.MOTEL_DETAIL);
};

/**
 * Agrega un motel a la lista de vistos recientemente
 */
export const addToRecentViews = async (motel) => {
  try {
    let recentViews = await getCache(CACHE_KEYS.RECENT_VIEWS, CACHE_EXPIRY.RECENT_VIEWS) || [];

    // Remover el motel si ya existe (para moverlo al inicio)
    recentViews = recentViews.filter(m => m.id !== motel.id);

    // Agregar al inicio
    recentViews.unshift(motel);

    // Mantener solo los últimos 20
    recentViews = recentViews.slice(0, 20);

    await setCache(CACHE_KEYS.RECENT_VIEWS, recentViews);
    return true;
  } catch (error) {
    console.error('Error adding to recent views:', error);
    return false;
  }
};

/**
 * Obtiene la lista de moteles vistos recientemente
 */
export const getRecentViews = async () => {
  return await getCache(CACHE_KEYS.RECENT_VIEWS, CACHE_EXPIRY.RECENT_VIEWS) || [];
};

/**
 * Agrega una búsqueda al historial
 */
export const addToSearchHistory = async (query) => {
  try {
    if (!query || query.trim().length === 0) return false;

    let searchHistory = await getCache(CACHE_KEYS.SEARCH_HISTORY, CACHE_EXPIRY.SEARCH_HISTORY) || [];

    // Remover si ya existe
    searchHistory = searchHistory.filter(q => q !== query);

    // Agregar al inicio
    searchHistory.unshift(query);

    // Mantener solo las últimas 50
    searchHistory = searchHistory.slice(0, 50);

    await setCache(CACHE_KEYS.SEARCH_HISTORY, searchHistory);
    return true;
  } catch (error) {
    console.error('Error adding to search history:', error);
    return false;
  }
};

/**
 * Obtiene el historial de búsquedas
 */
export const getSearchHistory = async () => {
  return await getCache(CACHE_KEYS.SEARCH_HISTORY, CACHE_EXPIRY.SEARCH_HISTORY) || [];
};

/**
 * Limpia el historial de búsquedas
 */
export const clearSearchHistory = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.SEARCH_HISTORY);
    return true;
  } catch (error) {
    console.error('Error clearing search history:', error);
    return false;
  }
};

/**
 * Actualiza el timestamp de última sincronización
 */
export const updateLastSync = async () => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    return true;
  } catch (error) {
    console.error('Error updating last sync:', error);
    return false;
  }
};

/**
 * Obtiene el timestamp de última sincronización
 */
export const getLastSync = async () => {
  try {
    const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSync ? parseInt(lastSync, 10) : null;
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
};

/**
 * Obtiene el tamaño del caché en bytes (aproximado)
 */
export const getCacheSize = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const jahataloKeys = keys.filter(key => key.startsWith('@jahatelo:'));
    const items = await AsyncStorage.multiGet(jahataloKeys);

    let totalSize = 0;
    items.forEach(([key, value]) => {
      if (value) {
        totalSize += value.length;
      }
    });

    return totalSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Formatea el tamaño del caché para mostrar
 */
export const formatCacheSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
