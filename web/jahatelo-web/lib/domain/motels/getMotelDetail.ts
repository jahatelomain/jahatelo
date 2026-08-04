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
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: {
          roomPhotos: { orderBy: { order: 'asc' } },
          amenities: { include: { amenity: true } },
          dayRates: true,
          weekdayRates: true,
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

  // La capa de mapeo público decide qué módulos publicar para FREE. Conservamos
  // las relaciones aquí para poder calcular el precio inicial y los amenities
  // agregados de las habitaciones; nunca se exponen como contenido navegable.
  return motel;
}
