import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const { categoryId, name, price, description } = body;

    if (!categoryId || !name || !price) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: categoryId, name, price' },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        price: parseInt(price),
        description,
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
    return NextResponse.json(
      { error: 'Error al crear item' },
      { status: 500 }
    );
  }
}
