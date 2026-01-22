import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { MotelStatus } from '@prisma/client';
import { BulkIdsSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * POST /api/admin/motels/bulk-approve
 * Aprueba múltiples moteles pendientes (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Solo SUPERADMIN puede aprobar moteles
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

    // Leer body
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = BulkIdsSchema.parse(sanitized);
    const { ids } = validated;

    // Buscar todos los moteles
    const motels = await prisma.motel.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, status: true },
    });

    if (motels.length === 0) {
      return NextResponse.json({ error: 'No se encontraron moteles con esos IDs' }, { status: 404 });
    }

    // Filtrar solo los que están PENDING
    const pendingMotels = motels.filter((m) => m.status === MotelStatus.PENDING);

    if (pendingMotels.length === 0) {
      return NextResponse.json(
        { error: 'Ninguno de los moteles seleccionados está pendiente de aprobación' },
        { status: 400 }
      );
    }

    // Aprobar todos en una transacción
    const updatedMotels = await prisma.$transaction(
      pendingMotels.map((motel) =>
        prisma.motel.update({
          where: { id: motel.id },
          data: {
            status: MotelStatus.APPROVED,
            isActive: true,
          },
        })
      )
    );

    // Log de auditoría para cada motel aprobado
    await Promise.all(
      pendingMotels.map((motel) =>
        logAuditEvent({
          userId: access.user?.id,
          action: 'APPROVE',
          entityType: 'Motel',
          entityId: motel.id,
          metadata: {
            name: motel.name,
            previousStatus: motel.status,
            newStatus: MotelStatus.APPROVED,
            bulkAction: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${updatedMotels.length} motel(es) aprobado(s) exitosamente`,
      count: updatedMotels.length,
      skipped: motels.length - pendingMotels.length,
    });
  } catch (error) {
    console.error('Error bulk approving motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al aprobar moteles' }, { status: 500 });
  }
}
