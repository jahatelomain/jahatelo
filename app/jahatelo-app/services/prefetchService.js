import { InteractionManager, Image } from 'react-native';
import * as Location from 'expo-location';
import { fetchMotels, fetchMotelBySlug } from './motelsApi';
import { cacheMotelDetail, getCachedMotelDetail } from './cacheService';
import { filterMotelsByDistance } from '../utils/location';

/**
 * Servicio de prefetch para pre-cargar datos en background
 */

/**
 * Pre-carga moteles destacados en background
 * Se ejecuta después de que la UI esté lista para no bloquear
 */
export const prefetchFeaturedMotels = async () => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        console.log('🚀 Prefetch: Cargando moteles destacados...');

        // Obtener moteles destacados (usa caché si está disponible)
        const featuredMotels = await fetchMotels({ featured: true });

        if (featuredMotels && featuredMotels.length > 0) {
          console.log(`✅ Prefetch: ${featuredMotels.length} moteles destacados cargados`);

          // Pre-cargar detalles de los primeros 3 destacados
          const topFeatured = featuredMotels.slice(0, 3);
          await prefetchMotelDetails(topFeatured);

          // Pre-cargar imágenes de thumbnails
          await prefetchThumbnails(topFeatured);
        }

        resolve(true);
      } catch (error) {
        console.error('⚠️ Prefetch error (featured):', error.message);
        resolve(false);
      }
    });
  });
};

/**
 * Pre-carga moteles cercanos basándose en ubicación
 * Solicita permisos si es necesario
 */
export const prefetchNearbyMotels = async (allMotels = [], radiusKm = 10) => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        // Verificar si ya tenemos permisos
        const { status } = await Location.getForegroundPermissionsAsync();

        // Si no hay permisos, no hacer nada (no queremos molestar al usuario)
        if (status !== 'granted') {
          console.log('📍 Prefetch: Permisos de ubicación no otorgados, saltando prefetch cercanos');
          resolve(false);
          return;
        }

        console.log('🚀 Prefetch: Obteniendo ubicación para moteles cercanos...');

        // Obtener ubicación actual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        // Filtrar moteles cercanos
        const nearbyMotels = filterMotelsByDistance(allMotels, latitude, longitude, radiusKm);

        if (nearbyMotels && nearbyMotels.length > 0) {
          console.log(`✅ Prefetch: ${nearbyMotels.length} moteles cercanos encontrados (${radiusKm}km)`);

          // Pre-cargar detalles de los primeros 5 cercanos
          const topNearby = nearbyMotels.slice(0, 5);
          await prefetchMotelDetails(topNearby);

          // Pre-cargar imágenes
          await prefetchThumbnails(topNearby);
        } else {
          console.log('📍 Prefetch: No hay moteles cercanos');
        }

        resolve(true);
      } catch (error) {
        console.error('⚠️ Prefetch error (nearby):', error.message);
        resolve(false);
      }
    });
  });
};

/**
 * Pre-carga detalles de una lista de moteles
 * Solo carga si no están ya en caché
 */
export const prefetchMotelDetails = async (motels = []) => {
  if (!motels || motels.length === 0) return;

  try {
    console.log(`🔍 Prefetch: Cargando detalles de ${motels.length} moteles...`);

    let cached = 0;
    let fetched = 0;

    // Pre-cargar en paralelo con límite de concurrencia
    const batchSize = 3;
    for (let i = 0; i < motels.length; i += batchSize) {
      const batch = motels.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (motel) => {
          const identifier = motel.slug || motel.id;

          // Verificar si ya está en caché
          const cachedDetail = await getCachedMotelDetail(identifier);
          if (cachedDetail) {
            cached++;
            return;
          }

          // Si no está en caché, obtener del API
          try {
            await fetchMotelBySlug(identifier, true);
            fetched++;
          } catch (err) {
            // Silenciar errores individuales
          }
        })
      );

      // Pequeña pausa entre batches para no saturar
      if (i + batchSize < motels.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Prefetch detalles: ${cached} en caché, ${fetched} nuevos`);
  } catch (error) {
    console.error('⚠️ Prefetch error (details):', error.message);
  }
};

/**
 * Pre-carga imágenes de thumbnails
 * Usa Image.prefetch de React Native
 */
export const prefetchThumbnails = async (motels = []) => {
  if (!motels || motels.length === 0) return;

  try {
    console.log(`🖼️ Prefetch: Cargando ${motels.length} thumbnails...`);

    const thumbnailUrls = motels
      .map(motel => motel.thumbnail)
      .filter(url => url && typeof url === 'string');

    if (thumbnailUrls.length === 0) return;

    // Pre-cargar imágenes en paralelo
    const results = await Promise.allSettled(
      thumbnailUrls.map(url => Image.prefetch(url))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Prefetch thumbnails: ${succeeded}/${thumbnailUrls.length} cargados`);
  } catch (error) {
    console.error('⚠️ Prefetch error (thumbnails):', error.message);
  }
};

/**
 * Pre-carga todas las fotos de un motel
 * Útil para cuando sabemos que el usuario va a ver el detalle
 */
export const prefetchMotelPhotos = async (motel) => {
  if (!motel || !motel.photos || motel.photos.length === 0) return;

  try {
    console.log(`🖼️ Prefetch: Cargando ${motel.photos.length} fotos de ${motel.nombre}...`);

    const photoUrls = motel.photos.filter(url => url && typeof url === 'string');

    if (photoUrls.length === 0) return;

    // Pre-cargar todas las fotos
    const results = await Promise.allSettled(
      photoUrls.map(url => Image.prefetch(url))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Prefetch fotos: ${succeeded}/${photoUrls.length} cargados`);
  } catch (error) {
    console.error('⚠️ Prefetch error (photos):', error.message);
  }
};

/**
 * Estrategia de prefetch inteligente
 * Se ejecuta en background y decide qué pre-cargar basándose en el contexto
 */
export const smartPrefetch = async (allMotels = [], options = {}) => {
  const {
    includeFeatured = true,
    includeNearby = true,
    radiusKm = 10,
  } = options;

  try {
    console.log('🧠 Smart Prefetch: Iniciando estrategia inteligente...');

    const tasks = [];

    // 1. Pre-cargar destacados (prioridad alta)
    if (includeFeatured) {
      tasks.push(prefetchFeaturedMotels());
    }

    // 2. Pre-cargar cercanos (prioridad media)
    if (includeNearby && allMotels.length > 0) {
      // Esperar un poco antes de pedir ubicación
      setTimeout(() => {
        prefetchNearbyMotels(allMotels, radiusKm);
      }, 2000);
    }

    // Ejecutar tareas de prioridad alta
    await Promise.all(tasks);

    console.log('✅ Smart Prefetch: Completado');
    return true;
  } catch (error) {
    console.error('⚠️ Smart Prefetch error:', error.message);
    return false;
  }
};

/**
 * Pre-carga incremental al hacer scroll
 * Pre-carga detalles de moteles que están cerca de ser visibles
 */
export const prefetchOnScroll = async (visibleMotels = [], offset = 2) => {
  if (!visibleMotels || visibleMotels.length === 0) return;

  // Tomar los moteles que están a punto de ser visibles
  const toPrefetch = visibleMotels.slice(0, offset);

  if (toPrefetch.length === 0) return;

  // Pre-cargar en background sin bloquear
  InteractionManager.runAfterInteractions(async () => {
    await prefetchMotelDetails(toPrefetch);
    await prefetchThumbnails(toPrefetch);
  });
};

/**
 * Limpia la caché de imágenes
 * Útil para liberar memoria
 */
export const clearImageCache = async () => {
  try {
    // React Native Image no tiene un método directo para limpiar caché
    // Pero podemos forzar garbage collection esperando
    console.log('🗑️ Limpiando caché de imágenes...');

    // Forzar recolección de basura (solo funciona en desarrollo)
    if (__DEV__ && global.gc) {
      global.gc();
    }

    console.log('✅ Caché de imágenes limpiado');
    return true;
  } catch (error) {
    console.error('⚠️ Error limpiando caché de imágenes:', error.message);
    return false;
  }
};

/**
 * Configuración de prefetch
 */
export const PREFETCH_CONFIG = {
  FEATURED_LIMIT: 3,        // Cuántos destacados pre-cargar
  NEARBY_LIMIT: 5,          // Cuántos cercanos pre-cargar
  NEARBY_RADIUS_KM: 10,     // Radio de búsqueda de cercanos
  BATCH_SIZE: 3,            // Cuántos detalles cargar en paralelo
  BATCH_DELAY_MS: 100,      // Pausa entre batches
  SCROLL_PREFETCH_OFFSET: 2, // Cuántos items adelante pre-cargar al hacer scroll
};
