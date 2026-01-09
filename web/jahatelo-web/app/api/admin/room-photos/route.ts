import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const { roomTypeId, url, order } = body;

    if (!roomTypeId || !url) {
      return NextResponse.json(
        { error: 'roomTypeId and url are required' },
        { status: 400 }
      );
    }

    const roomPhoto = await prisma.roomPhoto.create({
      data: {
        roomTypeId,
        url,
        order: order ?? 0,
      },
    });

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
    return NextResponse.json(
      { error: 'Failed to create room photo' },
      { status: 500 }
    );
  }
}
