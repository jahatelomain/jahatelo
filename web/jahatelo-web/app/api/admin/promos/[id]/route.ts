import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdatePromoSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

// PATCH /api/admin/promos/[id]
export async function PATCH(
  request: NextRequest,
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
    const validated = UpdatePromoSchema.parse(sanitized);

    const existingPromo = await prisma.promo.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true },
    });
    if (!existingPromo) {
      return NextResponse.json({ error: 'Promo no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && existingPromo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && validated.isGlobal === true) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const promo = await prisma.promo.update({
      where: { id: idResult.data },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
        ...(validated.validFrom !== undefined && { validFrom: validated.validFrom ? new Date(validated.validFrom) : null }),
        ...(validated.validUntil !== undefined && { validUntil: validated.validUntil ? new Date(validated.validUntil) : null }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.isGlobal !== undefined && { isGlobal: validated.isGlobal }),
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar promo' }, { status: 500 });
  }
}

// DELETE /api/admin/promos/[id]
export async function DELETE(
  request: NextRequest,
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

    const promo = await prisma.promo.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, title: true },
    });
    if (!promo) {
      return NextResponse.json({ error: 'Promo no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && promo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.promo.delete({ where: { id: idResult.data } });

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
