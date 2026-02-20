import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { touchMotel } from '@/lib/touchMotel';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { RoomPhotoSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

const getRoomPhotoLimit = (plan?: string | null) => {
  if (plan === 'GOLD') return 3;
  if (plan === 'DIAMOND') return null;
  return 1;
};

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = RoomPhotoSchema.parse(sanitized);

    const roomType = await prisma.roomType.findUnique({
      where: { id: validated.roomTypeId },
      select: { id: true, motelId: true, motel: { select: { plan: true } } },
    });

    if (!roomType) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    if (access.user?.role === 'MOTEL_ADMIN' && roomType.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const photoLimit = getRoomPhotoLimit(roomType.motel?.plan ?? 'BASIC');
    if (photoLimit !== null) {
      const currentCount = await prisma.roomPhoto.count({
        where: { roomTypeId: validated.roomTypeId },
      });
      if (currentCount >= photoLimit) {
        return NextResponse.json(
          { error: `Límite de ${photoLimit} fotos por habitación para este plan` },
          { status: 400 }
        );
      }
    }

    const roomPhoto = await prisma.roomPhoto.create({
      data: {
        roomTypeId: validated.roomTypeId,
        url: validated.url,
        order: validated.order ?? 0,
      },
    });

    await touchMotel(roomType.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'RoomPhoto',
      entityId: roomPhoto.id,
      metadata: { roomTypeId: roomPhoto.roomTypeId, url: roomPhoto.url },
    });

    return NextResponse.json(roomPhoto);
  } catch (error) {
    console.error('Error creating room photo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create room photo' },
      { status: 500 }
    );
  }
}
