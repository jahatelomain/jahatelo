import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

// PATCH /api/admin/promos/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'promos');
    if (access.error) return access.error;

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

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Promo',
      entityId: promo.id,
      metadata: { motelId: promo.motelId, title: promo.title },
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
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'promos');
    if (access.error) return access.error;

    const { id } = await params;

    const promo = await prisma.promo.delete({
      where: { id },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Promo',
      entityId: promo.id,
      metadata: { motelId: promo.motelId, title: promo.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promo:', error);
    return NextResponse.json({ error: 'Error al eliminar promo' }, { status: 500 });
  }
}
