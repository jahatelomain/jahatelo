import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { BulkActivateSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

/**
 * POST /api/admin/motels/bulk-activate
 * Activa o desactiva múltiples moteles (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Solo SUPERADMIN puede activar/desactivar moteles
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

    // Leer body
    const body = await request.json();
    const validated = BulkActivateSchema.parse(body);
    const { ids, isActive } = validated;

    // Buscar todos los moteles
    const motels = await prisma.motel.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, isActive: true },
    });

    if (motels.length === 0) {
      return NextResponse.json({ error: 'No se encontraron moteles con esos IDs' }, { status: 404 });
    }

    // Actualizar todos en una transacción
    const updatedMotels = await prisma.$transaction(
      motels.map((motel) =>
        prisma.motel.update({
          where: { id: motel.id },
          data: { isActive },
        })
      )
    );

    // Log de auditoría para cada motel
    await Promise.all(
      motels.map((motel) =>
        logAuditEvent({
          userId: access.user?.id,
          action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
          entityType: 'Motel',
          entityId: motel.id,
          metadata: {
            name: motel.name,
            previousActive: motel.isActive,
            newActive: isActive,
            bulkAction: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${updatedMotels.length} motel(es) ${isActive ? 'activado(s)' : 'desactivado(s)'} exitosamente`,
      count: updatedMotels.length,
    });
  } catch (error) {
    console.error('Error bulk activating/deactivating motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar moteles' }, { status: 500 });
  }
}
