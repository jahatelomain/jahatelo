import { InteractionManager, Image } from 'react-native';
import * as Location from 'expo-location';
import { fetchMotels, fetchMotelBySlug } from './motelsApi';
import { getCachedMotelDetail } from './cacheService';
import { filterMotelsByDistance } from '../utils/location';

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

export const prefetchMotelDetails = async (motels = []) => {
  if (!motels.length) return;
  for (let index = 0; index < motels.length; index += 3) {
    await Promise.all(motels.slice(index, index + 3).map(async (motel) => {
      const identifier = motel.slug || motel.id;
      if (!identifier || await getCachedMotelDetail(identifier)) return;
      try { await fetchMotelBySlug(identifier, true); } catch { /* Prefetch no bloquea la UI. */ }
    }));
  }
};

export const prefetchThumbnails = async (motels = []) => {
  const urls = motels.map((motel) => motel.thumbnail).filter((url) => typeof url === 'string' && url);
  if (urls.length) await Promise.allSettled(urls.map((url) => Image.prefetch(url)));
};

export const prefetchFeaturedMotels = async () => new Promise((resolve) => {
  InteractionManager.runAfterInteractions(async () => {
    try {
      const motels = await fetchMotels({ featured: true });
      const selected = motels.slice(0, 3);
      await Promise.all([prefetchMotelDetails(selected), prefetchThumbnails(selected)]);
      resolve(true);
    } catch (error) {
      debugLog('Prefetch featured error:', error.message);
      resolve(false);
    }
  });
});

export const prefetchNearbyMotels = async (allMotels = [], radiusKm = 10) => {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  try {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const motels = filterMotelsByDistance(allMotels, coords.latitude, coords.longitude, radiusKm).slice(0, 5);
    await Promise.all([prefetchMotelDetails(motels), prefetchThumbnails(motels)]);
    return true;
  } catch (error) {
    debugLog('Prefetch nearby error:', error.message);
    return false;
  }
};

export const smartPrefetch = async (allMotels = [], options = {}) => {
  const { includeFeatured = true, includeNearby = true, radiusKm = 10 } = options;
  if (includeFeatured) await prefetchFeaturedMotels();
  if (includeNearby && allMotels.length) setTimeout(() => prefetchNearbyMotels(allMotels, radiusKm), 2000);
  return true;
};

export const prefetchOnScroll = async (visibleMotels = [], offset = 2) => {
  const motels = visibleMotels.slice(0, offset);
  if (!motels.length) return;
  InteractionManager.runAfterInteractions(() => Promise.all([prefetchMotelDetails(motels), prefetchThumbnails(motels)]));
};

export const clearImageCache = async () => {
  if (__DEV__ && global.gc) global.gc();
  return true;
};

export const PREFETCH_CONFIG = {
  FEATURED_LIMIT: 3,
  NEARBY_LIMIT: 5,
  NEARBY_RADIUS_KM: 10,
  BATCH_SIZE: 3,
  BATCH_DELAY_MS: 100,
  SCROLL_PREFETCH_OFFSET: 2,
};
