import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

/**
 * GET /api/favorites
 * Obtiene los favoritos del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Obtener información de los moteles
    const motelIds = favorites
      .filter((f) => f.motelId)
      .map((f) => f.motelId as string);

    const motels = await prisma.motel.findMany({
      where: {
        id: { in: motelIds },
        isActive: true,
      },
      include: {
        photos: {
          where: {
            kind: 'FACADE',
          },
          take: 1,
          orderBy: {
            order: 'asc',
          },
        },
        rooms: {
          select: {
            id: true,
            price1h: true,
            price3h: true,
            price12h: true,
            price24h: true,
          },
          orderBy: {
            price1h: 'asc',
          },
          take: 1,
        },
        promos: {
          where: {
            isActive: true,
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } },
            ],
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      favorites: favorites.map((fav) => ({
        id: fav.id,
        motelId: fav.motelId,
        createdAt: fav.createdAt,
        motel: motels.find((m) => m.id === fav.motelId),
      })),
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Agrega un motel a favoritos
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { motelId } = body;

    if (!motelId) {
      return NextResponse.json(
        { error: 'motelId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { id: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_motelId: {
          userId: user.id,
          motelId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El motel ya está en favoritos' },
        { status: 400 }
      );
    }

    // Crear favorito
    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        motelId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Error al agregar a favoritos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites
 * Remueve un motel de favoritos
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');

    if (!motelId) {
      return NextResponse.json(
        { error: 'motelId es requerido' },
        { status: 400 }
      );
    }

    // Buscar el favorito
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_motelId: {
          userId: user.id,
          motelId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorito no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar favorito
    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Error al remover de favoritos' },
      { status: 500 }
    );
  }
}
