import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { IdSchema, InboxUpdateSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

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
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = InboxUpdateSchema.parse(sanitized);
    const { isRead } = validated;

    // Verificar que el mensaje existe
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: idResult.data },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar mensaje
    const updatedMessage = await prisma.contactMessage.update({
      where: { id: idResult.data },
      data: { isRead },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating inbox message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
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
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que el mensaje existe
    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: idResult.data },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar mensaje
    await prisma.contactMessage.delete({
      where: { id: idResult.data },
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
