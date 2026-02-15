import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitize';

const MobileFavoriteSchema = z.object({
  motelId: z.string().min(1).max(100),
  roomTypeId: z.string().min(1).max(100).optional().nullable(),
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/favorites
 *
 * Obtiene todos los favoritos del usuario autenticado
 * Header: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar IDs de los favoritos del usuario
    const favoriteRecords = await prisma.favorite.findMany({
      where: {
        userId: payload.id,
      },
      select: {
        id: true,
        motelId: true,
        roomTypeId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const motelIds = favoriteRecords
      .filter((f) => f.motelId)
      .map((f) => f.motelId as string);

    // Si no hay favoritos, devolver vacío
    if (motelIds.length === 0) {
      return NextResponse.json({ success: true, favorites: [], motelIds: [] });
    }

    // Obtener datos frescos de los moteles
    const motels = await prisma.motel.findMany({
      where: {
        id: { in: motelIds },
        isActive: true,
        status: 'APPROVED',
      },
      include: {
        photos: { orderBy: { order: 'asc' as const }, take: 3 },
        motelAmenities: { include: { amenity: true } },
        rooms: {
          where: { isActive: true },
          select: {
            isActive: true,
            price1h: true,
            price1_5h: true,
            price2h: true,
            price3h: true,
            price12h: true,
            price24h: true,
            priceNight: true,
          },
        },
        promos: { where: { isActive: true } },
      },
    });

    // Indexar moteles por id para preservar el orden de favoritos
    const motelMap = new Map(motels.map((m) => [m.id, m]));

    // Mapear a formato de app con datos frescos, en el orden original de favoritos
    const favorites = motelIds
      .map((mid) => motelMap.get(mid))
      .filter((motel): motel is NonNullable<typeof motel> => motel !== undefined)
      .map((motel) => {
        const featuredPhoto =
          motel.featuredPhotoApp || motel.featuredPhotoWeb || motel.featuredPhoto || null;
        const thumbnail = featuredPhoto || motel.photos[0]?.url || null;
        const photos = Array.from(
          new Set([
            ...(featuredPhoto ? [featuredPhoto] : []),
            ...motel.photos.map((p) => p.url),
          ])
        ).slice(0, 3);

        const allPrices = motel.rooms
          .filter((r) => r.isActive)
          .flatMap((r) =>
            ([r.price1h, r.price1_5h, r.price2h, r.price3h, r.price12h, r.price24h, r.priceNight] as (number | null)[])
              .filter((p): p is number => p !== null && p !== undefined)
          );
        const precioDesde = allPrices.length > 0 ? Math.min(...allPrices) : 0;

        return {
          id: motel.id,
          slug: motel.slug,
          nombre: motel.name,
          barrio: motel.neighborhood,
          ciudad: motel.city,
          precioDesde,
          amenities: motel.motelAmenities.map((ma) => ({
            name: ma.amenity.name,
            icon: ma.amenity.icon,
          })),
          rating: motel.ratingAvg,
          tienePromo: motel.promos.some((p) => p.isActive),
          isFeatured: motel.isFeatured,
          thumbnail,
          photos,
          plan: motel.plan,
        };
      });

    return NextResponse.json({
      success: true,
      favorites,
      motelIds: favorites.map((f) => f.id),
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/favorites:', error);
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/favorites
 *
 * Agrega un favorito
 * Body: { motelId, roomTypeId? }
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = MobileFavoriteSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { motelId, roomTypeId } = parsed.data;

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { id: true, name: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe el favorito
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_motelId: {
          userId: payload.id,
          motelId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({
        success: true,
        favorite: existingFavorite,
        message: 'Ya está en favoritos',
      });
    }

    // Crear favorito
    const favorite = await prisma.favorite.create({
      data: {
        userId: payload.id,
        motelId,
        roomTypeId: roomTypeId || null,
      },
    });

    // Registrar evento de analytics
    await prisma.motelAnalytics.create({
      data: {
        motelId,
        eventType: 'FAVORITE_ADD',
        source: 'MOBILE',
        deviceType: 'MOBILE',
      },
    });

    return NextResponse.json({
      success: true,
      favorite,
      message: 'Agregado a favoritos',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/mobile/favorites:', error);
    return NextResponse.json(
      { error: 'Error al agregar favorito' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mobile/favorites
 *
 * Elimina un favorito
 * Query: ?motelId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');
    const parsed = MobileFavoriteSchema.pick({ motelId: true }).safeParse({
      motelId: motelId ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'motelId inválido' },
        { status: 400 }
      );
    }
    const { motelId: validatedMotelId } = parsed.data;

    // Eliminar favorito
    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId: payload.id,
      motelId: validatedMotelId,
    },
  });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Favorito no encontrado' },
        { status: 404 }
      );
    }

    // Registrar evento de analytics
    await prisma.motelAnalytics.create({
      data: {
        motelId: validatedMotelId,
        eventType: 'FAVORITE_REMOVE',
        source: 'MOBILE',
        deviceType: 'MOBILE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Favorito eliminado',
    });

  } catch (error) {
    console.error('Error in DELETE /api/mobile/favorites:', error);
    return NextResponse.json(
      { error: 'Error al eliminar favorito' },
      { status: 500 }
    );
  }
}
