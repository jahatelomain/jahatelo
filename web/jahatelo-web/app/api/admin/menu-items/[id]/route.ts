import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateMenuItemSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existingItem = await prisma.menuItem.findUnique({
      where: { id: idResult.data },
      select: { id: true, category: { select: { motelId: true } } },
    });
    if (!existingItem) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && existingItem.category?.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateMenuItemSchema.parse(sanitized);

    const item = await prisma.menuItem.update({
      where: { id: idResult.data },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.price !== undefined && { price: validated.price }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.photoUrl !== undefined && { photoUrl: validated.photoUrl }),
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'MenuItem',
      entityId: item.id,
      metadata: { categoryId: item.categoryId, name: item.name },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating menu item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: idResult.data },
      select: { id: true, categoryId: true, name: true, category: { select: { motelId: true } } },
    });
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && item.category?.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.menuItem.delete({ where: { id: idResult.data } });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'MenuItem',
      entityId: item.id,
      metadata: { categoryId: item.categoryId, name: item.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    );
  }
}
