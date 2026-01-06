import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';

/**
 * PATCH /api/admin/prospects/[id]
 * Actualiza el estado o notas de un prospect (solo SUPERADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Validar que el prospecto existe
    const prospect = await prisma.motelProspect.findUnique({
      where: { id },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect no encontrado' },
        { status: 404 }
      );
    }

    // Validar estado si se provee
    if (status && !['NEW', 'CONTACTED', 'IN_NEGOTIATION', 'WON', 'LOST'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Actualizar prospect
    const updatedProspect = await prisma.motelProspect.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updatedProspect);
  } catch (error) {
    console.error('Error updating prospect:', error);
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
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que existe
    const prospect = await prisma.motelProspect.findUnique({
      where: { id },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar
    await prisma.motelProspect.delete({
      where: { id },
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
