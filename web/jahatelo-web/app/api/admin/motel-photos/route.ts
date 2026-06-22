import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { touchMotel } from '@/lib/touchMotel';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

const MotelPhotoSchema = z.object({
  motelId: z.string().min(1),
  url: z.string().url(),
  order: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = MotelPhotoSchema.parse(sanitized);

    if (access.user?.role === 'MOTEL_ADMIN' && validated.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const nextOrder =
      validated.order ??
      (await prisma.photo.count({ where: { motelId: validated.motelId } }));

    const photo = await prisma.photo.create({
      data: {
        motelId: validated.motelId,
        url: validated.url,
        order: nextOrder,
      },
    });

    await touchMotel(validated.motelId);

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Photo',
      entityId: photo.id,
      metadata: { motelId: validated.motelId, url: validated.url },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error creating motel photo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create motel photo' }, { status: 500 });
  }
}
