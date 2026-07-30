import { prisma } from '@/lib/prisma';

/** Fuente única de filtros y ordenamiento para el detalle público. */
export async function getPublicMotelDetail(slugOrId: string) {
  const now = new Date();

  const motel = await prisma.motel.findFirst({
    where: {
      OR: [{ slug: slugOrId }, { id: slugOrId }],
      status: 'APPROVED',
      isActive: true,
    },
    include: {
      rooms: {
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { isFeatured: 'desc' }, { name: 'asc' }],
        include: {
          roomPhotos: { orderBy: { order: 'asc' } },
          amenities: { include: { amenity: true } },
          dayRates: true,
        },
      },
      menuCategories: {
        orderBy: { order: 'asc' },
        include: { items: { orderBy: { name: 'asc' } } },
      },
      promos: {
        where: {
          isActive: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          ],
        },
        orderBy: { createdAt: 'desc' },
      },
      schedules: { orderBy: { dayOfWeek: 'asc' } },
    },
  });

  if (!motel || motel.plan !== 'FREE') return motel;

  // FREE es visible, pero no publica módulos comerciales ni contenido de habitaciones.
  return {
    ...motel,
    rooms: [],
    promos: [],
    menuCategories: [],
    ratingAvg: 0,
    ratingCount: 0,
  };
}
