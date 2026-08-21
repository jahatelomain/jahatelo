import * as FileSystem from 'expo-file-system/legacy';

const MARKERS_DIRECTORY = `${FileSystem.cacheDirectory}jahatelo-map-markers/`;
const MAX_PARALLEL_DOWNLOADS = 4;

const sanitizeFilePart = (value) => String(value || '').replace(/[^a-zA-Z0-9._-]/g, '_');

async function ensureMarkersDirectory() {
  const info = await FileSystem.getInfoAsync(MARKERS_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MARKERS_DIRECTORY, { intermediates: true });
  }
}

async function resolveMarkerImage(motel, apiRoot) {
  const version = sanitizeFilePart(motel.markerVersion || motel.plan || 'v1');
  const fileUri = `${MARKERS_DIRECTORY}${sanitizeFilePart(motel.id)}-${version}.png`;
  const cachedFile = await FileSystem.getInfoAsync(fileUri);
  if (cachedFile.exists) return fileUri;

  const markerUrl = `${apiRoot}/api/mobile/motels/map-marker?id=${encodeURIComponent(motel.id)}&v=${encodeURIComponent(motel.markerVersion || '')}`;
  const download = await FileSystem.downloadAsync(markerUrl, fileUri);
  return download.status >= 200 && download.status < 300 ? download.uri : null;
}

async function runWithLimit(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const next = async () => {
    const index = cursor;
    cursor += 1;
    if (index >= items.length) return;
    results[index] = await worker(items[index]);
    await next();
  };
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_DOWNLOADS, items.length) }, next));
  return results;
}

/**
 * Convierte los rótulos del mapa en archivos PNG locales antes de montar los
 * markers. Google Maps los renderiza como una sola imagen nativa, sin views
 * React ni cálculos de coordenadas en cada pan/zoom.
 */
export async function withCachedMapMarkerImages(motels, apiRoot) {
  if (!Array.isArray(motels) || motels.length === 0) return [];
  try {
    await ensureMarkersDirectory();
    const imageUris = await runWithLimit(motels, async (motel) => {
      try {
        return await resolveMarkerImage(motel, apiRoot);
      } catch {
        return null;
      }
    });
    return motels.map((motel, index) => ({ ...motel, markerImageUri: imageUris[index] }));
  } catch {
    return motels;
  }
}
