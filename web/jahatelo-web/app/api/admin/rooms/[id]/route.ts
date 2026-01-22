import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateRoomAdminSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateRoomAdminSchema.parse(sanitized);

    // Update room and replace amenities
    const room = await prisma.roomType.update({
      where: { id: idResult.data },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.basePrice !== undefined && { basePrice: validated.basePrice ?? null }),
        ...(validated.priceLabel !== undefined && { priceLabel: validated.priceLabel ?? null }),
        ...(validated.price1h !== undefined && { price1h: validated.price1h ?? null }),
        ...(validated.price1_5h !== undefined && { price1_5h: validated.price1_5h ?? null }),
        ...(validated.price2h !== undefined && { price2h: validated.price2h ?? null }),
        ...(validated.price3h !== undefined && { price3h: validated.price3h ?? null }),
        ...(validated.price12h !== undefined && { price12h: validated.price12h ?? null }),
        ...(validated.price24h !== undefined && { price24h: validated.price24h ?? null }),
        ...(validated.priceNight !== undefined && { priceNight: validated.priceNight ?? null }),
        ...(validated.maxPersons !== undefined && { maxPersons: validated.maxPersons ?? null }),
        ...(validated.hasJacuzzi !== undefined && { hasJacuzzi: validated.hasJacuzzi }),
        ...(validated.hasPrivateGarage !== undefined && { hasPrivateGarage: validated.hasPrivateGarage }),
        ...(validated.isFeatured !== undefined && { isFeatured: validated.isFeatured }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        amenities: validated.amenityIds !== undefined
          ? {
              deleteMany: {},
              create: (validated.amenityIds || []).map((amenityId: string) => ({
                amenityId,
              })),
            }
          : undefined,
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Room',
      entityId: room.id,
      metadata: { motelId: room.motelId, name: room.name },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar habitación' },
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
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const room = await prisma.roomType.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Room',
      entityId: room.id,
      metadata: { motelId: room.motelId, name: room.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Error al eliminar habitación' },
      { status: 500 }
    );
  }
}
