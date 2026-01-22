import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { MotelStatus } from '@prisma/client';
import { IdSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/motels/[id]/reject
 * Rechaza un motel pendiente (solo SUPERADMIN)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Solo SUPERADMIN puede rechazar moteles
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;
    const resolvedId = IdSchema.parse(id);

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: resolvedId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!motel) {
      return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
    }

    // Verificar que está en estado PENDING
    if (motel.status !== MotelStatus.PENDING) {
      return NextResponse.json(
        {
          error: `Este motel ya fue ${motel.status === MotelStatus.APPROVED ? 'aprobado' : 'rechazado'}`,
        },
        { status: 400 }
      );
    }

    // Rechazar el motel
    const updatedMotel = await prisma.motel.update({
      where: { id: resolvedId },
      data: {
        status: MotelStatus.REJECTED,
        isActive: false, // Desactivar al rechazar
      },
    });

    // Log de auditoría
    await logAuditEvent({
      userId: access.user?.id,
      action: 'REJECT',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: {
        name: motel.name,
        previousStatus: motel.status,
        newStatus: MotelStatus.REJECTED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Motel "${motel.name}" rechazado`,
      motel: updatedMotel,
    });
  } catch (error) {
    console.error('Error rejecting motel:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID inválido', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al rechazar motel' }, { status: 500 });
  }
}
