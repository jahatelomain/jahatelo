import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { canAccessMotel } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateMotelSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
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
          where: { motelId: idResult.data },
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
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
      []
    );

    const menuCategories = await safeFetch(
      'menu categories',
      () =>
        prisma.menuCategory.findMany({
          where: { motelId: idResult.data },
          include: {
            items: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        }),
      []
    );

    return NextResponse.json({
      ...motel,
      rooms,
      menuCategories,
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
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();

    // Validar con Zod
    const validated = UpdateMotelSchema.parse(body);

    // Sanitizar campos de texto
    const data: Prisma.MotelUpdateInput = {
      ...validated,
      ...(validated.name ? { name: sanitizeText(validated.name) } : {}),
      ...(validated.description ? { description: sanitizeText(validated.description) } : {}),
      ...(validated.city ? { city: sanitizeText(validated.city) } : {}),
      ...(validated.address ? { address: sanitizeText(validated.address) } : {}),
    };

    // Manejar nextBillingAt si existe
    if (body.nextBillingAt !== undefined) {
      data.nextBillingAt = body.nextBillingAt ? new Date(body.nextBillingAt).toISOString() : null;
    }

    const motel = await prisma.motel.update({
      where: { id: idResult.data },
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
          details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
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

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
      select: { id: true, name: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    await prisma.motel.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: { name: motel.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting motel:', error);
    return NextResponse.json(
      { error: 'Error al eliminar motel' },
      { status: 500 }
    );
  }
}
