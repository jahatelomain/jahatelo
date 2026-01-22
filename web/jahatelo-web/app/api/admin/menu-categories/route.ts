import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { MenuCategorySchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = MenuCategorySchema.parse(sanitized);

    const category = await prisma.menuCategory.create({
      data: {
        motelId: validated.motelId,
        title: validated.title,
        sortOrder: validated.sortOrder ?? 0,
      },
      include: {
        items: true,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'MenuCategory',
      entityId: category.id,
      metadata: { motelId: category.motelId, title: category.title },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
