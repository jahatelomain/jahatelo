import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { MenuItemSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = MenuItemSchema.parse(sanitized);

    if (access.user?.role === 'MOTEL_ADMIN') {
      const category = await prisma.menuCategory.findUnique({
        where: { id: validated.categoryId },
        select: { id: true, motelId: true },
      });
      if (!category) {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
      }
      if (!access.user.motelId || category.motelId !== access.user.motelId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId: validated.categoryId,
        name: validated.name,
        price: validated.price,
        description: validated.description ?? null,
        photoUrl: validated.photoUrl ?? null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'MenuItem',
      entityId: item.id,
      metadata: { categoryId: item.categoryId, name: item.name },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    );
  }
}
