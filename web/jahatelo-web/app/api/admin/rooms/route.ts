import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { RoomAdminSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = RoomAdminSchema.parse(sanitized);

    const room = await prisma.roomType.create({
      data: {
        motelId: validated.motelId,
        name: validated.name,
        description: validated.description ?? null,
        basePrice: validated.basePrice ?? null,
        priceLabel: validated.priceLabel ?? null,
        price1h: validated.price1h ?? null,
        price1_5h: validated.price1_5h ?? null,
        price2h: validated.price2h ?? null,
        price3h: validated.price3h ?? null,
        price12h: validated.price12h ?? null,
        price24h: validated.price24h ?? null,
        priceNight: validated.priceNight ?? null,
        maxPersons: validated.maxPersons ?? null,
        hasJacuzzi: validated.hasJacuzzi ?? false,
        hasPrivateGarage: validated.hasPrivateGarage ?? false,
        isFeatured: validated.isFeatured ?? false,
        isActive: true,
        amenities: validated.amenityIds && validated.amenityIds.length > 0
          ? {
              create: validated.amenityIds.map((amenityId: string) => ({
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
      action: 'CREATE',
      entityType: 'Room',
      entityId: room.id,
      metadata: { motelId: room.motelId, name: room.name },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear habitación' },
      { status: 500 }
    );
  }
}
