import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { touchMotel } from '@/lib/touchMotel';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

const UpdateMotelPhotoSchema = z.object({
  order: z.number().int().min(0).optional(),
  url: z.string().url().optional(),
});

export async function DELETE(
  request: Request,
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

    const photo = await prisma.photo.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, url: true },
    });
    if (!photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && photo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.photo.delete({ where: { id: idResult.data } });

    // Re-order remaining photos to keep ordering contiguous
    if (photo.motelId) {
      const remaining = await prisma.photo.findMany({
        where: { motelId: photo.motelId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      await Promise.all(
        remaining.map((p, index) =>
          prisma.photo.update({ where: { id: p.id }, data: { order: index } })
        )
      );
      await touchMotel(photo.motelId);
    }

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Photo',
      entityId: photo.id,
      metadata: { motelId: photo.motelId, url: photo.url },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting motel photo:', error);
    return NextResponse.json({ error: 'Failed to delete motel photo' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
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

    const photo = await prisma.photo.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, url: true },
    });
    if (!photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
    }
    if (access.user?.role === 'MOTEL_ADMIN' && photo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = UpdateMotelPhotoSchema.parse(sanitized);

    const updated = await prisma.photo.update({
      where: { id: idResult.data },
      data: {
        ...(validated.order !== undefined && { order: validated.order }),
        ...(validated.url !== undefined && { url: validated.url }),
      },
    });

    if (photo.motelId) await touchMotel(photo.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Photo',
      entityId: updated.id,
      metadata: { motelId: photo.motelId, url: updated.url },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating motel photo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update motel photo' }, { status: 500 });
  }
}
