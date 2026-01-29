import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { BulkIdsSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * POST /api/admin/motels/bulk-delete
 * Elimina múltiples moteles (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = BulkIdsSchema.parse(sanitized);
    const { ids } = validated;

    const motels = await prisma.motel.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    if (motels.length === 0) {
      return NextResponse.json({ error: 'No se encontraron moteles con esos IDs' }, { status: 404 });
    }

    await prisma.motel.deleteMany({
      where: { id: { in: motels.map((m) => m.id) } },
    });

    await Promise.all(
      motels.map((motel) =>
        logAuditEvent({
          userId: access.user?.id,
          action: 'DELETE',
          entityType: 'Motel',
          entityId: motel.id,
          metadata: {
            name: motel.name,
            bulkAction: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${motels.length} motel(es) eliminado(s)`,
      count: motels.length,
    });
  } catch (error) {
    console.error('Error bulk deleting motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar moteles' }, { status: 500 });
  }
}
