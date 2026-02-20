import { Prisma } from '@prisma/client';
import { touchMotel } from '@/lib/touchMotel';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateRoomPhotoSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const roomPhoto = await prisma.roomPhoto.findUnique({
      where: { id: idResult.data },
      select: { id: true, roomTypeId: true, url: true, roomType: { select: { motelId: true } } },
    });
    if (!roomPhoto) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && roomPhoto.roomType?.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.roomPhoto.delete({ where: { id: idResult.data } });

    if (roomPhoto.roomType?.motelId) await touchMotel(roomPhoto.roomType.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'RoomPhoto',
      entityId: roomPhoto.id,
      metadata: { roomTypeId: roomPhoto.roomTypeId, url: roomPhoto.url },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete room photo' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const roomPhoto = await prisma.roomPhoto.findUnique({
      where: { id: idResult.data },
      select: { id: true, roomTypeId: true, url: true, roomType: { select: { motelId: true } } },
    });
    if (!roomPhoto) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && roomPhoto.roomType?.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateRoomPhotoSchema.parse(sanitized);

    const updateData: Prisma.RoomPhotoUpdateInput = {};
    if (validated.order !== undefined && validated.order !== null) {
      updateData.order = validated.order;
    }
    if (validated.url !== undefined) updateData.url = validated.url;

    const updatedPhoto = await prisma.roomPhoto.update({
      where: { id: idResult.data },
      data: updateData,
    });

    if (roomPhoto.roomType?.motelId) await touchMotel(roomPhoto.roomType.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'RoomPhoto',
      entityId: updatedPhoto.id,
      metadata: { roomTypeId: updatedPhoto.roomTypeId, url: updatedPhoto.url },
    });

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating room photo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update room photo' },
      { status: 500 }
    );
  }
}
