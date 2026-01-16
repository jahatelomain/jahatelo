import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { canAccessMotel } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { UpdateMotelSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const motel = await prisma.motel.findUnique({
      where: { id },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    const safeFetch = async <T>(label: string, fetcher: () => Promise<T>, fallback: T) => {
      try {
        return await fetcher();
      } catch (error) {
        console.error(`Error fetching ${label} for motel ${id}:`, error);
        return fallback;
      }
    };

    const rooms = await safeFetch(
      'rooms',
      () =>
        prisma.roomType.findMany({
          where: { motelId: id },
          include: {
            amenities: {
              include: {
                amenity: true,
              },
            },
            roomPhotos: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        }),
      []
    );

    const menuCategories = await safeFetch(
      'menu categories',
      () =>
        prisma.menuCategory.findMany({
          where: { motelId: id },
          include: {
            items: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        }),
      []
    );

    const photos = await safeFetch(
      'photos',
      () =>
        prisma.photo.findMany({
          where: { motelId: id },
          orderBy: { order: 'asc' },
        }),
      []
    );

    const motelAmenities = await safeFetch(
      'motel amenities',
      () =>
        prisma.motelAmenity.findMany({
          where: { motelId: id },
          include: {
            amenity: true,
          },
        }),
      []
    );

    return NextResponse.json({
      ...motel,
      rooms,
      menuCategories,
      photos,
      motelAmenities,
    });
  } catch (error) {
    console.error('Error fetching motel:', error);
    return NextResponse.json(
      { error: 'Error al obtener motel' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();

    // Validar con Zod
    const validated = UpdateMotelSchema.parse(body);

    // Sanitizar campos de texto
    const data: any = { ...validated };
    if (data.name) data.name = sanitizeText(data.name);
    if (data.description) data.description = sanitizeText(data.description);
    if (data.city) data.city = sanitizeText(data.city);
    if (data.neighborhood) data.neighborhood = sanitizeText(data.neighborhood);
    if (data.address) data.address = sanitizeText(data.address);

    // Manejar nextBillingAt si existe
    if (body.nextBillingAt !== undefined) {
      data.nextBillingAt = body.nextBillingAt ? new Date(body.nextBillingAt).toISOString() : null;
    }

    const motel = await prisma.motel.update({
      where: { id },
      data,
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: { name: motel.name },
    });

    return NextResponse.json(motel);
  } catch (error) {
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error('Error updating motel:', error);
    return NextResponse.json(
      { error: 'Error al actualizar motel' },
      { status: 500 }
    );
  }
}
