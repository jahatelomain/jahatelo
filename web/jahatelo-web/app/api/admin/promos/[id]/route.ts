import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/admin/promos/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, imageUrl, validFrom, validUntil, isActive, isGlobal } = body;

    const promo = await prisma.promo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(isGlobal !== undefined && { isGlobal }),
      },
    });

    return NextResponse.json(promo);
  } catch (error) {
    console.error('Error updating promo:', error);
    return NextResponse.json({ error: 'Error al actualizar promo' }, { status: 500 });
  }
}

// DELETE /api/admin/promos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.promo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promo:', error);
    return NextResponse.json({ error: 'Error al eliminar promo' }, { status: 500 });
  }
}
