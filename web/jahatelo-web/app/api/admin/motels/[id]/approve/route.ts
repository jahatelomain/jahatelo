import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { MotelStatus } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/motels/[id]/approve
 * Aprueba un motel pendiente (solo SUPERADMIN)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Solo SUPERADMIN puede aprobar moteles
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id },
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

    // Aprobar el motel
    const updatedMotel = await prisma.motel.update({
      where: { id },
      data: {
        status: MotelStatus.APPROVED,
        isActive: true, // Activar automáticamente al aprobar
      },
    });

    // Log de auditoría
    await logAuditEvent({
      userId: access.user?.id,
      action: 'APPROVE',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: {
        name: motel.name,
        previousStatus: motel.status,
        newStatus: MotelStatus.APPROVED,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Motel "${motel.name}" aprobado exitosamente`,
      motel: updatedMotel,
    });
  } catch (error) {
    console.error('Error approving motel:', error);
    return NextResponse.json({ error: 'Error al aprobar motel' }, { status: 500 });
  }
}
