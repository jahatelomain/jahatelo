import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id } = await params;

    const roomPhoto = await prisma.roomPhoto.delete({
      where: { id },
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
    const body = await request.json();
    const { order, url } = body;

    const updateData: { order?: number; url?: string } = {};
    if (order !== undefined) updateData.order = order;
    if (url !== undefined) updateData.url = url;

    const roomPhoto = await prisma.roomPhoto.update({
      where: { id },
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
    return NextResponse.json(
      { error: 'Failed to update room photo' },
      { status: 500 }
    );
  }
}
