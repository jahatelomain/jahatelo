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
  // Una respuesta 429 anterior podía quedar guardada con extensión .png. No
  // reutilizar archivos demasiado pequeños porque son cuerpos de error, no un
  // rótulo válido.
  if (cachedFile.exists && Number(cachedFile.size || 0) >= 256) return fileUri;
  if (cachedFile.exists) await FileSystem.deleteAsync(fileUri, { idempotent: true });

  const markerUrl = `${apiRoot}/api/mobile/motels/map-marker?id=${encodeURIComponent(motel.id)}&v=${encodeURIComponent(motel.markerVersion || '')}`;
  const temporaryUri = `${fileUri}.download`;
  const download = await FileSystem.downloadAsync(markerUrl, temporaryUri);
  if (download.status < 200 || download.status >= 300) {
    await FileSystem.deleteAsync(temporaryUri, { idempotent: true });
    return null;
  }
  const downloadedFile = await FileSystem.getInfoAsync(temporaryUri);
  if (!downloadedFile.exists || Number(downloadedFile.size || 0) < 256) {
    await FileSystem.deleteAsync(temporaryUri, { idempotent: true });
    return null;
  }
  await FileSystem.moveAsync({ from: temporaryUri, to: fileUri });
  return fileUri;
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
