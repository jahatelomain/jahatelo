import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const { motelId, title, sortOrder } = body;

    if (!motelId || !title) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: motelId, title' },
        { status: 400 }
      );
    }

    const category = await prisma.menuCategory.create({
      data: {
        motelId,
        title,
        sortOrder: sortOrder || 0,
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
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
