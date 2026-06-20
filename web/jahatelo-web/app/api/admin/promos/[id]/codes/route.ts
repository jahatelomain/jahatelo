import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminPaginationSchema } from '@/lib/validations/schemas';

// GET /api/admin/promos/[id]/codes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id: promoId } = await params;

    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
      select: { id: true, motelId: true },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promo no encontrada' }, { status: 404 });
    }

    if (access.user?.role === 'MOTEL_ADMIN' && promo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;

    const [codes, total, summary] = await Promise.all([
      prisma.promoCode.findMany({
        where: { promoId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          code: true,
          status: true,
          deviceId: true,
          createdAt: true,
          redeemedAt: true,
          redeemedBy: true,
        },
      }),
      prisma.promoCode.count({ where: { promoId } }),
      prisma.promoCode.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { promoId },
      }),
    ]);

    const summaryData = summary.reduce<{ total: number; pending: number; used: number }>(
      (acc, item) => {
        if (item.status === 'PENDING') acc.pending = item._count._all;
        if (item.status === 'USED') acc.used = item._count._all;
        return acc;
      },
      { total, pending: 0, used: 0 }
    );

    const formatted = codes.map((c) => ({
      ...c,
      deviceId: c.deviceId.slice(0, 8),
    }));

    return NextResponse.json({
      data: formatted,
      summary: summaryData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json({ error: 'Error al obtener códigos' }, { status: 500 });
  }
}
