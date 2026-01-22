import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AMENITY_ICONS } from '@/lib/amenityIcons';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateAmenitySchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET single amenity
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const amenity = await prisma.amenity.findUnique({
      where: { id: idResult.data },
      include: {
        _count: {
          select: {
            roomAmenities: true,
            motelAmenities: true,
          },
        },
      },
    });

    if (!amenity) {
      return NextResponse.json(
        { error: 'Amenity no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error fetching amenity:', error);
    return NextResponse.json(
      { error: 'Error al obtener amenity' },
      { status: 500 }
    );
  }
}

// PATCH update amenity
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateAmenitySchema.parse(sanitized);
    if (!validated.name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // Check if another amenity with the same name exists
    const existing = await prisma.amenity.findFirst({
      where: {
        name,
        id: { not: idResult.data },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe otro amenity con ese nombre' },
        { status: 400 }
      );
    }

    if (validated.icon && !AMENITY_ICONS.some((item) => item.value === validated.icon)) {
      return NextResponse.json(
        { error: 'Ícono inválido' },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenity.update({
      where: { id: idResult.data },
      data: {
        name: validated.name,
        type: validated.type || null,
        icon: validated.icon || null,
        description: validated.description || null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Amenity',
      entityId: amenity.id,
      metadata: { name: amenity.name },
    });

    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error updating amenity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar amenity' },
      { status: 500 }
    );
  }
}

// DELETE amenity
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const amenity = await prisma.amenity.findUnique({
      where: { id: idResult.data },
    });

    if (!amenity) {
      return NextResponse.json(
        { error: 'Amenity no encontrado' },
        { status: 404 }
      );
    }

    await prisma.motelAmenity.deleteMany({
      where: { amenityId: idResult.data },
    });

    await prisma.roomAmenity.deleteMany({
      where: { amenityId: idResult.data },
    });

    await prisma.amenity.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Amenity',
      entityId: idResult.data,
      metadata: { name: amenity.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting amenity:', error);
    return NextResponse.json(
      { error: 'Error al eliminar amenity' },
      { status: 500 }
    );
  }
}
