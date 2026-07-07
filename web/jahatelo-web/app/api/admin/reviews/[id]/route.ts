import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema } from '@/lib/validations/schemas';

// DELETE /api/admin/reviews/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: idResult.data },
      select: { id: true, motelId: true, score: true, userId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    if (access.user?.role === 'MOTEL_ADMIN' && review.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id: idResult.data } });

    // Recalcular rating del motel
    const remaining = await prisma.review.aggregate({
      where: { motelId: review.motelId! },
      _avg: { score: true },
      _count: { score: true },
    });

    await prisma.motel.update({
      where: { id: review.motelId! },
      data: {
        ratingAvg: remaining._avg.score ?? 0,
        ratingCount: remaining._count.score ?? 0,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Review',
      entityId: idResult.data,
      metadata: { motelId: review.motelId, score: review.score },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Error al eliminar reseña' }, { status: 500 });
  }
}
