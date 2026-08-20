import { normalizeLocalUploadPath, normalizeLocalUrl } from '@/lib/normalizeLocalUrl';

type MediaEntity = object;

const asRecord = (entity: MediaEntity) => entity as Record<string, unknown>;

/**
 * La API administrativa nunca debe entregar una URL ligada a localhost o a la
 * IP LAN de quien cargó la imagen. Las URLs históricas se resuelven contra el
 * origen de la solicitud actual, sin modificar la URL externa de S3/CDN.
 */
export const getRequestBaseUrl = (request: Request): string => new URL(request.url).origin;

export function normalizeMediaFields<T extends MediaEntity>(
  entity: T,
  baseUrl: string,
  fields: readonly string[],
): T {
  const record = asRecord(entity);
  const normalized: Record<string, unknown> = { ...record };

  for (const field of fields) {
    if (!(field in record)) continue;
    const value = record[field];
    if (typeof value === 'string' || value === null) {
      normalized[field] = normalizeLocalUrl(value, baseUrl);
    }
  }

  return normalized as T;
}

export function normalizeMotelMedia<T extends MediaEntity>(motel: T, baseUrl: string): T {
  const normalized = normalizeMediaFields(motel, baseUrl, [
    'featuredPhoto',
    'featuredPhotoWeb',
    'featuredPhotoApp',
    'logoUrl',
  ]);
  const record = asRecord(normalized);

  if (Array.isArray(record.rooms)) {
    record.rooms = record.rooms.map((room) => {
      if (!room || typeof room !== 'object') return room;
      const normalizedRoom = normalizeMediaFields(room, baseUrl, []);
      const roomRecord = asRecord(normalizedRoom);
      if (Array.isArray(roomRecord.roomPhotos)) {
        roomRecord.roomPhotos = roomRecord.roomPhotos.map((photo) =>
          photo && typeof photo === 'object'
            ? normalizeMediaFields(photo, baseUrl, ['url'])
            : photo,
        );
      }
      return normalizedRoom;
    });
  }

  if (Array.isArray(record.promos)) {
    record.promos = record.promos.map((promo) =>
      promo && typeof promo === 'object'
        ? normalizeMediaFields(promo, baseUrl, ['imageUrl'])
        : promo,
    );
  }

  if (Array.isArray(record.menuCategories)) {
    record.menuCategories = record.menuCategories.map((category) => {
      if (!category || typeof category !== 'object') return category;
      const categoryRecord = asRecord(category);
      return {
        ...categoryRecord,
        items: Array.isArray(categoryRecord.items)
          ? categoryRecord.items.map((item) =>
              item && typeof item === 'object'
                ? normalizeMediaFields(item, baseUrl, ['photoUrl'])
                : item,
            )
          : categoryRecord.items,
      };
    });
  }

  return normalized;
}

/** Guarda rutas locales en formato relativo, evitando volver a persistir una IP LAN. */
export const normalizeMediaUrlForStorage = (value?: string | null): string | null =>
  normalizeLocalUploadPath(value);
