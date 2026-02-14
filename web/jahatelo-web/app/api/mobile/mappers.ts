import { Motel, RoomType, Photo, Amenity, MotelAmenity, RoomAmenity, Promo, RoomPhoto } from '@prisma/client';

type RoomPricingInfo = Pick<
  RoomType,
  | 'isActive'
  | 'price1h'
  | 'price1_5h'
  | 'price2h'
  | 'price3h'
  | 'price12h'
  | 'price24h'
  | 'priceNight'
>;

// Types for detail mappers
type RoomWithRelations = RoomType & {
  photos: Photo[];
  amenities: (RoomAmenity & { amenity: Amenity })[];
  roomPhotos?: RoomPhoto[];
};

// Base type for list items - accepts both pricing info and full room data
type MotelForList = Motel & {
  photos: Photo[];
  motelAmenities: (MotelAmenity & { amenity: Amenity })[];
  rooms?: (RoomPricingInfo | RoomWithRelations)[];
  promos?: Promo[];
};

type MotelWithRelations = Motel & {
  photos: Photo[];
  motelAmenities: (MotelAmenity & { amenity: Amenity })[];
  rooms?: RoomWithRelations[];
  promos?: Promo[];
};

/**
 * Calcula el precio inicial (mínimo) de las habitaciones activas de un motel
 */
export function getStartingPrice(rooms?: (RoomPricingInfo | RoomWithRelations)[]): number | null {
  if (!rooms || rooms.length === 0) return null;

  const activeRooms = rooms.filter((r) => r.isActive);
  if (activeRooms.length === 0) return null;

  const allPrices: number[] = [];
  activeRooms.forEach((room) => {
    if (room.price1h) allPrices.push(room.price1h);
    if (room.price1_5h) allPrices.push(room.price1_5h);
    if (room.price2h) allPrices.push(room.price2h);
    if (room.price3h) allPrices.push(room.price3h);
    if (room.price12h) allPrices.push(room.price12h);
    if (room.price24h) allPrices.push(room.price24h);
    if (room.priceNight) allPrices.push(room.priceNight);
  });

  return allPrices.length > 0 ? Math.min(...allPrices) : null;
}

/**
 * Obtiene el thumbnail (featuredPhoto > primera foto FACADE > primera foto disponible)
 */
export function getThumbnail(photos: Photo[], featuredPhoto?: string | null): string | null {
  // Prioridad 1: featuredPhoto
  if (featuredPhoto) return featuredPhoto;

  // Prioridad 2: primera foto FACADE
  if (!photos || photos.length === 0) return null;

  const facadePhoto = photos.find((p) => p.kind === 'FACADE');
  if (facadePhoto) return facadePhoto.url;

  // Prioridad 3: primera foto disponible
  return photos[0]?.url || null;
}

/**
 * Obtiene hasta 3 URLs de fotos para el listado
 */
export function getListPhotos(photos: Photo[], featuredPhoto?: string | null): string[] {
  const urls = (photos || []).map((p) => p.url).filter(Boolean);
  const unique = new Set<string>();
  if (featuredPhoto) unique.add(featuredPhoto);
  urls.slice(0, 3).forEach((url) => unique.add(url));
  return Array.from(unique);
}

export function getAllPhotos(photos: Photo[], featuredPhoto?: string | null): string[] {
  const urls = (photos || []).map((p) => p.url).filter(Boolean);
  const unique = new Set<string>();
  if (featuredPhoto) unique.add(featuredPhoto);
  urls.forEach((url) => unique.add(url));
  return Array.from(unique);
}

const getPreferredFeaturedPhoto = (motel: Motel) => {
  return motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto || null;
};

/**
 * Agrega un query param ?v=timestamp para cache-busting de imágenes en la app.
 * Usar updatedAt del registro (promo o motel) para que cambie solo cuando la imagen cambia.
 */
function addVersionParam(url: string | null | undefined, updatedAt?: Date | null): string | null {
  if (!url) return null;
  const ts = updatedAt?.getTime();
  if (!ts) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${ts}`;
}

/**
 * Verifica si hay promos activas
 */
export function hasActivePromos(promos?: Promo[]): boolean {
  if (!promos || promos.length === 0) return false;

  const now = new Date();
  return promos.some((promo) => {
    if (!promo.isActive) return false;
    if (promo.validFrom && promo.validFrom > now) return false;
    if (promo.validUntil && promo.validUntil < now) return false;
    return true;
  });
}

/**
 * Obtiene la primera promo activa de un motel
 */
function getFirstActivePromo(promos?: Promo[]) {
  if (!promos || promos.length === 0) return null;

  const now = new Date();
  const activePromo = promos.find((promo) => {
    if (!promo.isActive) return false;
    if (promo.validFrom && promo.validFrom > now) return false;
    if (promo.validUntil && promo.validUntil < now) return false;
    return true;
  });

  return activePromo || null;
}

/**
 * Mapea un Motel con relaciones al formato de listado para mobile
 */
export function mapMotelToListItem(motel: MotelForList) {
  const hasPromotions = hasActivePromos(motel.promos);
  const firstPromo = getFirstActivePromo(motel.promos);

  return {
    id: motel.id,
    slug: motel.slug,
    name: motel.name,
    description: motel.description,
    city: motel.city,
    neighborhood: motel.neighborhood,
    address: motel.address,
    location:
      motel.latitude && motel.longitude
        ? { lat: motel.latitude, lng: motel.longitude }
        : null,
    rating: {
      average: motel.ratingAvg,
      count: motel.ratingCount,
    },
    isFeatured: motel.isFeatured,
    hasPromo: hasPromotions,
    tienePromo: hasPromotions,
    startingPrice: getStartingPrice(motel.rooms),
    amenities: motel.motelAmenities.map((ma) => ({
      name: ma.amenity.name,
      icon: ma.amenity.icon,
    })),
    thumbnail: getThumbnail(motel.photos, getPreferredFeaturedPhoto(motel)),
    photos: getListPhotos(motel.photos, getPreferredFeaturedPhoto(motel)),
    featuredPhoto: getPreferredFeaturedPhoto(motel),
    // Incluir datos de la primera promo activa para el carrusel
    // ?v=updatedAt fuerza al cache nativo de React Native a recargar cuando cambia la imagen
    promoImageUrl: addVersionParam(firstPromo?.imageUrl, firstPromo?.updatedAt),
    promoTitle: firstPromo?.title || null,
    promoDescription: firstPromo?.description || null,
    // Plan del motel para badges y ordenamiento
    plan: motel.plan,
    // Timestamp de última actualización para cache-busting en la app
    updatedAt: motel.updatedAt,
  };
}

/**
 * Genera el priceLabel basado en los precios disponibles
 */
export function generatePriceLabel(room: RoomType): string {
  const prices = [
    { value: room.price1h, label: '1h' },
    { value: room.price1_5h, label: '1.5h' },
    { value: room.price2h, label: '2h' },
    { value: room.price3h, label: '3h' },
    { value: room.price12h, label: '12h' },
    { value: room.price24h, label: '24h' },
    { value: room.priceNight, label: 'noche' },
  ].filter((p) => p.value !== null);

  if (prices.length === 0) return 'Precio no disponible';

  const minPrice = Math.min(...prices.map((p) => p.value!));
  return `Desde $${minPrice.toLocaleString('es-CO')}`;
}

/**
 * Mapea un RoomType al formato para mobile (detalle)
 */
export function mapRoomForMobile(room: RoomWithRelations) {
  const basePrice = room.basePrice || room.price1h || room.price2h || 0;

  // Priorizar roomPhotos sobre photos (legacy)
  const photoUrls = room.roomPhotos && room.roomPhotos.length > 0
    ? room.roomPhotos.map((p) => p.url)
    : room.photos.map((p) => p.url);

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    basePrice,
    priceLabel: room.priceLabel || generatePriceLabel(room),
    prices: {
      price1h: room.price1h,
      price1_5h: room.price1_5h,
      price2h: room.price2h,
      price3h: room.price3h,
      price12h: room.price12h,
      price24h: room.price24h,
      priceNight: room.priceNight,
    },
    amenities: room.amenities.map((ra) => ({
      name: ra.amenity.name,
      icon: ra.amenity.icon,
    })),
    photos: photoUrls,
    maxPersons: room.maxPersons,
    hasJacuzzi: room.hasJacuzzi,
    hasPrivateGarage: room.hasPrivateGarage,
    isFeatured: room.isFeatured,
  };
}

/**
 * Mapea un Motel completo al formato de detalle para mobile
 */
export function mapMotelToDetail(
  motel: MotelWithRelations & {
    schedules?: { dayOfWeek: number; openTime: string | null; closeTime: string | null; is24Hours: boolean; isClosed: boolean }[];
    menuCategories?: { id: string; name: string | null; items: { id: string; name: string; price: number; description: string | null; photoUrl: string | null }[] }[];
    paymentMethods?: { method: string }[];
  }
) {
  const listItem = mapMotelToListItem(motel);

  return {
    ...listItem,
    photos: getListPhotos(motel.photos, getPreferredFeaturedPhoto(motel)),
    allPhotos: getAllPhotos(motel.photos, getPreferredFeaturedPhoto(motel)),
    promos:
      motel.promos
        ?.filter((promo) => {
          if (!promo.isActive) return false;
          const now = new Date();
          if (promo.validFrom && promo.validFrom > now) return false;
          if (promo.validUntil && promo.validUntil < now) return false;
          return true;
        })
        .map((promo) => ({
          id: promo.id,
          title: promo.title,
          description: promo.description,
          imageUrl: promo.imageUrl,
          isGlobal: promo.isGlobal,
          validFrom: promo.validFrom,
          validUntil: promo.validUntil,
        })) || [],
    contact: {
      phone: motel.phone,
      whatsapp: motel.whatsapp,
      website: motel.website,
      instagram: motel.instagram,
      contactEmail: motel.contactEmail,
      contactPhone: motel.contactPhone,
    },
    plan: motel.plan,
    nextBillingAt: motel.nextBillingAt,
    schedules: motel.schedules || [],
    menu:
      motel.menuCategories?.map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          photoUrl: item.photoUrl,
        })),
      })) || [],
    rooms: motel.rooms?.filter((r) => r.isActive).map(mapRoomForMobile) || [],
    paymentMethods: motel.paymentMethods?.map((pm) => pm.method) || [],
    hasPhotos:
      motel.photos.length > 0 ||
      Boolean(motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto),
  };
}
