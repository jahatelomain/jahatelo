import { Motel, RoomType, Amenity, RoomAmenity, Promo, RoomPhoto, RoomDayRate, RoomWeekdayRate, DayGroup } from '@prisma/client';
import {
  getCurrentDayGroup,
  getEffectiveRoomPrices,
  getStartingRoomPrice,
  getStartingRoomPricesByDay,
} from '@/lib/domain/motels/pricing';

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
> & {
  dayRates?: RoomDayRate[];
  weekdayRates?: RoomWeekdayRate[];
};

/**
 * Devuelve WEEKDAY o WEEKEND según el día actual (hora local del servidor)
 */
export { getCurrentDayGroup };

/**
 * Devuelve los precios efectivos para una habitación dado un dayGroup.
 * Prioriza dayRates si existe entrada para el grupo; fallback a precios base de RoomType.
 */
export function getEffectivePrices(
  room: Pick<RoomType, 'price1h' | 'price1_5h' | 'price2h' | 'price3h' | 'price12h' | 'price24h' | 'priceNight'> & { dayRates?: RoomDayRate[]; weekdayRates?: RoomWeekdayRate[] },
  dayGroup: DayGroup
) {
  return getEffectiveRoomPrices(room, dayGroup);
}

// Amenity data for list context (minimal fields)
type RoomAmenityForList = {
  amenity: Pick<Amenity, 'id' | 'name' | 'icon'>;
};

// Room type for list context: pricing + amenities
type RoomForList = RoomPricingInfo & {
  amenities?: RoomAmenityForList[];
};

// Types for detail mappers
type RoomWithRelations = RoomType & {
  amenities: (RoomAmenity & { amenity: Amenity })[];
  roomPhotos: RoomPhoto[];
  dayRates?: RoomDayRate[];
  weekdayRates?: RoomWeekdayRate[];
};

// Base type for list items - accepts both pricing info and full room data
type MotelForList = Motel & {
  rooms?: (RoomForList | RoomWithRelations)[];
  promos?: Promo[];
};

type MotelWithRelations = Motel & {
  rooms?: RoomWithRelations[];
  promos?: Promo[];
};

/**
 * Calcula el precio inicial (mínimo) de las habitaciones activas de un motel.
 * Usa precios del día actual si existen dayRates; sino usa precios base.
 */
export function getStartingPrice(rooms?: (RoomPricingInfo | RoomWithRelations)[]): number | null {
  return getStartingRoomPrice(rooms);
}

/**
 * Obtiene la portada configurada del motel.
 */
export function getThumbnail(featuredPhoto?: string | null): string | null {
  return featuredPhoto || null;
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
  const isFreePlan = motel.plan === 'FREE';
  const hasPromotions = !isFreePlan && hasActivePromos(motel.promos);
  const firstPromo = isFreePlan ? null : getFirstActivePromo(motel.promos);

  const startingPrices = getStartingRoomPricesByDay(motel.rooms);

  return {
    id: motel.id,
    slug: motel.slug,
    name: motel.name,
    description: motel.description,
    city: motel.city,
    address: motel.address,
    mapUrl: motel.mapUrl,
    location:
      motel.latitude && motel.longitude
        ? { lat: motel.latitude, lng: motel.longitude }
        : null,
    rating: {
      average: isFreePlan ? 0 : motel.ratingAvg,
      count: isFreePlan ? 0 : motel.ratingCount,
    },
    isFeatured: motel.isFeatured,
    hasPromo: hasPromotions,
    tienePromo: hasPromotions,
    startingPrice: getStartingPrice(motel.rooms),
    startingPriceWeekday: startingPrices.weekday,
    startingPriceWeekend: startingPrices.weekend,
    amenities: (() => {
      // Aggregate unique amenities from all active room amenities
      const map = new Map<string, { name: string; icon: string | null }>();
      for (const room of motel.rooms || []) {
        if (!room.isActive) continue;
        const roomAmenities = (room as RoomForList).amenities ?? (room as RoomWithRelations).amenities;
        for (const ra of roomAmenities ?? []) {
          const amenity = ra?.amenity;
          if (amenity?.id && amenity.name && !map.has(amenity.id)) {
            map.set(amenity.id, { name: amenity.name, icon: amenity.icon });
          }
        }
      }
      return Array.from(map.values());
    })(),
    thumbnail: getThumbnail(getPreferredFeaturedPhoto(motel)),
    featuredPhoto: getPreferredFeaturedPhoto(motel),
    // La app usa la variante vertical como portada. La web consume esta
    // variante explícita para no recortar una imagen 4:5 dentro de una card 16:9.
    featuredPhotoWeb: motel.featuredPhotoWeb || motel.featuredPhoto || motel.featuredPhotoApp || null,
    logoUrl: motel.logoUrl || null,
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
 * Mapea un RoomType al formato para mobile (detalle)
 */
export function mapRoomForMobile(room: RoomWithRelations) {
  const photoUrls = room.roomPhotos.map((photo) => photo.url);

  const dayGroup = getCurrentDayGroup();
  const effectivePrices = getEffectivePrices(room, dayGroup);

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    prices: effectivePrices,
    dayRates: room.dayRates?.map((dr) => ({
      dayGroup: dr.dayGroup,
      price1h: dr.price1h,
      price1_5h: dr.price1_5h,
      price2h: dr.price2h,
      price3h: dr.price3h,
      price12h: dr.price12h,
      price24h: dr.price24h,
      priceNight: dr.priceNight,
    })) || [],
    weekdayRates: room.weekdayRates?.map((rate) => ({
      weekday: rate.weekday,
      duration: rate.duration,
      price: rate.price,
    })) || [],
    amenities: room.amenities
      .filter((ra) => Boolean(ra?.amenity?.name))
      .map((ra) => ({
        name: ra.amenity.name,
        icon: ra.amenity.icon,
      })),
    photos: photoUrls,
    maxPersons: room.maxPersons,
    hasJacuzzi: room.hasJacuzzi,
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
  }
) {
  const listItem = mapMotelToListItem(motel);
  const isFreePlan = motel.plan === 'FREE';

  return {
    ...listItem,
    promos: isFreePlan ? [] :
      motel.promos
        ?.filter((promo) => promo.isActive)
        .map((promo) => ({
          id: promo.id,
          title: promo.title,
          description: promo.description,
          imageUrl: promo.imageUrl,
          isGlobal: promo.isGlobal,
          hasPromoCode: promo.hasPromoCode,
          validFrom: promo.validFrom,
          validUntil: promo.validUntil,
        })) || [],
    contact: {
      phone: motel.phone,
      whatsapp: motel.whatsapp,
      contactEmail: motel.contactEmail,
      contactPhone: motel.contactPhone,
    },
    plan: motel.plan,
    nextBillingAt: motel.nextBillingAt,
    schedules: motel.schedules || [],
    menu: isFreePlan ? [] :
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
    rooms: isFreePlan ? [] : motel.rooms?.filter((r) => r.isActive).map(mapRoomForMobile) || [],
    hasPhotos:
      Boolean(motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto),
  };
}
