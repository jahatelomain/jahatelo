import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdminPaginationSchema, PromoQuerySchema, PromoSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

const getPromoLimit = (plan?: string | null) => {
  if (plan === 'GOLD') return 5;
  if (plan === 'DIAMOND') return null;
  return 1;
};

// GET /api/admin/promos?motelId=xxx
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const queryResult = PromoQuerySchema.safeParse({
      motelId: searchParams.get('motelId') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { motelId, search: searchQuery, status, type } = queryResult.data;
    let effectiveMotelId = motelId;

    if (access.user?.role === 'MOTEL_ADMIN') {
      if (!access.user.motelId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
      if (effectiveMotelId && effectiveMotelId !== access.user.motelId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
      effectiveMotelId = access.user.motelId;
    }

    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: paginationResult.error.issues }, { status: 400 });
    }
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;

    const searchFilter = searchQuery?.trim();
    const baseWhere: Prisma.PromoWhereInput = {
      ...(effectiveMotelId ? { motelId: effectiveMotelId } : {}),
      ...(searchFilter
        ? {
            OR: [
              { title: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { motel: { name: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };
    const dataWhere: Prisma.PromoWhereInput = {
      ...baseWhere,
      ...(status ? { isActive: status === 'ACTIVE' } : {}),
      ...(type ? { isGlobal: type === 'GLOBAL' } : {}),
      ...(access.user?.role === 'MOTEL_ADMIN' ? { isGlobal: false } : {}),
    };
    const total = await prisma.promo.count({ where: dataWhere });

    const summaryActive = await prisma.promo.groupBy({
      by: ['isActive'],
      _count: { _all: true },
      where: baseWhere,
    });
    const summaryGlobal = await prisma.promo.groupBy({
      by: ['isGlobal'],
      _count: { _all: true },
      where: baseWhere,
    });
    const activeCounts = summaryActive.reduce<Record<string, number>>((acc, item) => {
      acc[item.isActive ? 'active' : 'inactive'] = item._count?._all ?? 0;
      return acc;
    }, {});
    const typeCounts = summaryGlobal.reduce<Record<string, number>>((acc, item) => {
      acc[item.isGlobal ? 'global' : 'specific'] = item._count?._all ?? 0;
      return acc;
    }, {});

    const promos = await prisma.promo.findMany({
      where: dataWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        motel: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(promos);
    }

    return NextResponse.json({
      data: promos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          activeCounts,
          typeCounts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching promos:', error);
    return NextResponse.json({ error: 'Error al obtener promos' }, { status: 500 });
  }
}

// POST /api/admin/promos
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = PromoSchema.parse(sanitized);

    if (access.user?.role === 'MOTEL_ADMIN') {
      if (!access.user.motelId || validated.motelId !== access.user.motelId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    }

    const motel = await prisma.motel.findUnique({
      where: { id: validated.motelId },
      select: { id: true, plan: true },
    });

    if (!motel) {
      return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
    }

    const promoLimit = getPromoLimit(motel.plan ?? 'BASIC');
    const isActive = validated.isActive ?? true;
    if (promoLimit !== null && isActive) {
      const activeCount = await prisma.promo.count({
        where: { motelId: validated.motelId, isActive: true },
      });
      if (activeCount >= promoLimit) {
        return NextResponse.json(
          { error: `Límite de ${promoLimit} promos activas para este plan` },
          { status: 400 }
        );
      }
    }

    const promo = await prisma.promo.create({
      data: {
        motelId: validated.motelId,
        title: validated.title,
        description: validated.description ?? null,
        imageUrl: validated.imageUrl ?? null,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : null,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        isActive: validated.isActive ?? true,
        isGlobal: access.user?.role === 'MOTEL_ADMIN' ? false : validated.isGlobal ?? false,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Promo',
      entityId: promo.id,
      metadata: { motelId: promo.motelId, title: promo.title },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    console.error('Error creating promo:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear promo' }, { status: 500 });
  }
}
