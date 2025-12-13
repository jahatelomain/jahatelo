import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.roomPhoto.delete({
      where: { id },
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

    return NextResponse.json(roomPhoto);
  } catch (error) {
    console.error('Error updating room photo:', error);
    return NextResponse.json(
      { error: 'Failed to update room photo' },
      { status: 500 }
    );
  }
}
