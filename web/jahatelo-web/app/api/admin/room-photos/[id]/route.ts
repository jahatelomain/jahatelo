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

    const roomPhoto = await prisma.roomPhoto.delete({
      where: { id: idResult.data },
    });

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
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateRoomPhotoSchema.parse(sanitized);

    const updateData: { order?: number | null; url?: string | null } = {};
    if (validated.order !== undefined) updateData.order = validated.order ?? null;
    if (validated.url !== undefined) updateData.url = validated.url ?? null;

    const roomPhoto = await prisma.roomPhoto.update({
      where: { id: idResult.data },
      data: updateData,
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'RoomPhoto',
      entityId: roomPhoto.id,
      metadata: { roomTypeId: roomPhoto.roomTypeId, url: roomPhoto.url },
    });

    return NextResponse.json(roomPhoto);
  } catch (error) {
    console.error('Error updating room photo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update room photo' },
      { status: 500 }
    );
  }
}
