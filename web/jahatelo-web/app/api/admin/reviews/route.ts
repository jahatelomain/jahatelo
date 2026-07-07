import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { IdSchema } from '@/lib/validations/schemas';

// GET /api/admin/reviews?motelId=xxx
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');

    if (!motelId) {
      return NextResponse.json({ error: 'motelId es requerido' }, { status: 400 });
    }

    const idResult = IdSchema.safeParse(motelId);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    if (access.user?.role === 'MOTEL_ADMIN' && access.user.motelId !== idResult.data) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      where: { motelId: idResult.data },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
}
