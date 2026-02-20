import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { touchMotel } from '@/lib/touchMotel';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateMenuCategorySchema } from '@/lib/validations/schemas';
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

    const existingCategory = await prisma.menuCategory.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, title: true },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && existingCategory.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateMenuCategorySchema.parse(sanitized);

    const category = await prisma.menuCategory.update({
      where: { id: idResult.data },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
      },
    });

    await touchMotel(category.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'MenuCategory',
      entityId: category.id,
      metadata: { motelId: category.motelId, title: category.title },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
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

    const category = await prisma.menuCategory.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, title: true },
    });
    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && category.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.menuCategory.delete({ where: { id: idResult.data } });

    await touchMotel(category.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'MenuCategory',
      entityId: category.id,
      metadata: { motelId: category.motelId, title: category.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
