import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { z } from 'zod';

const ReorderSchema = z.object({
  motelId: z.string().min(1),
  roomIds: z.array(z.string().min(1)).min(1),
});

/**
 * PATCH /api/admin/rooms/reorder
 * Reordena las habitaciones de un motel.
 * Body: { motelId: string, roomIds: string[] } (en el orden deseado)
 */
export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 });
    }

    const { motelId, roomIds } = parsed.data;

    if (access.user?.role === 'MOTEL_ADMIN' && access.user.motelId !== motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar que todas las habitaciones pertenecen al motel
    const rooms = await prisma.roomType.findMany({
      where: { id: { in: roomIds }, motelId },
      select: { id: true },
    });

    if (rooms.length !== roomIds.length) {
      return NextResponse.json({ error: 'Algunas habitaciones no pertenecen al motel' }, { status: 400 });
    }

    // Actualizar order en paralelo
    await Promise.all(
      roomIds.map((id, index) =>
        prisma.roomType.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering rooms:', error);
    return NextResponse.json({ error: 'Error al reordenar habitaciones' }, { status: 500 });
  }
}
