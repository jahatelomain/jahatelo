import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdminProspectUpdateSchema, IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * PATCH /api/admin/prospects/[id]
 * Actualiza el estado o notas de un prospect (solo SUPERADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'prospects');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdminProspectUpdateSchema.parse(sanitized);
    const { status, notes, channel } = validated;

    // Validar que el prospecto existe
    const prospect = await prisma.motelProspect.findUnique({
      where: { id: idResult.data },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar prospect
    const updatedProspect = await prisma.motelProspect.update({
      where: { id: idResult.data },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(channel && { channel }),
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Prospect',
      entityId: updatedProspect.id,
      metadata: { status: updatedProspect.status, channel: updatedProspect.channel },
    });

    return NextResponse.json(updatedProspect);
  } catch (error) {
    console.error('Error updating prospect:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar prospect' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prospects/[id]
 * Elimina un prospect (solo SUPERADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'prospects');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que existe
    const prospect = await prisma.motelProspect.findUnique({
      where: { id: idResult.data },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar
    await prisma.motelProspect.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Prospect',
      entityId: idResult.data,
      metadata: { motelName: prospect.motelName, channel: prospect.channel },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json(
      { error: 'Error al eliminar prospect' },
      { status: 500 }
    );
  }
}
