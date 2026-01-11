import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

/**
 * PATCH /api/admin/inbox/:id
 * Marca un mensaje como leído/no leído (solo SUPERADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
    if (access.error) return access.error;

    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'isRead debe ser un booleano' },
        { status: 400 }
      );
    }

    // Verificar que el mensaje existe
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar mensaje
    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating inbox message:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mensaje' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/inbox/:id
 * Elimina un mensaje (solo SUPERADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
    if (access.error) return access.error;

    const { id } = await params;

    // Verificar que el mensaje existe
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar mensaje
    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Mensaje eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting inbox message:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mensaje' },
      { status: 500 }
    );
  }
}
