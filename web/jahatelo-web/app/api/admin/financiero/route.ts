import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminPaginationSchema, EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/financiero
 * Lista todos los moteles con datos financieros (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = z
      .object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
        active: z.enum(['true', 'false']).optional(),
        search: z.string().max(100).optional(),
      })
      .safeParse({
        status: searchParams.get('status') || undefined,
        active: searchParams.get('active') || undefined,
        search: searchParams.get('search') || undefined,
      });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { status, active, search: searchQuery } = queryResult.data;
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
    EmptySchema.parse({});
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'financiero');
    if (access.error) return access.error;

    const searchFilter = searchQuery?.trim();
    const baseWhere: Prisma.MotelWhereInput = {
      ...(searchFilter
        ? {
            OR: [
              { name: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { city: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactName: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactEmail: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactPhone: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { adminContactName: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { adminContactEmail: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { adminContactPhone: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };
    const isMotelAdmin = access.user?.role === 'MOTEL_ADMIN';
    const motelId = access.user?.motelId;
    if (isMotelAdmin && !motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const dataWhere: Prisma.MotelWhereInput = isMotelAdmin
      ? { id: motelId }
      : {
          ...baseWhere,
          ...(status ? { status } : {}),
          ...(active ? { isActive: active === 'true' } : {}),
        };
    const total = await prisma.motel.count({ where: dataWhere });

    const statusCounts: Record<string, number> = {};
    const activeCounts: Record<string, number> = {};
    if (!isMotelAdmin) {
      const statusSummary = await prisma.motel.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: baseWhere,
      });
      const activeSummary = await prisma.motel.groupBy({
        by: ['isActive'],
        _count: { _all: true },
        where: baseWhere,
      });
      statusSummary.forEach((item) => {
        statusCounts[item.status] = item._count?._all ?? 0;
      });
      activeSummary.forEach((item) => {
        activeCounts[item.isActive ? 'active' : 'inactive'] = item._count?._all ?? 0;
      });
    }

    const motels = await prisma.motel.findMany({
      where: dataWhere,
      select: {
        id: true,
        name: true,
        billingDay: true,
        paymentType: true,
        financialStatus: true,
        billingCompanyName: true,
        billingTaxId: true,
        adminContactName: true,
        adminContactEmail: true,
        adminContactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { status: 'asc' },
        { name: 'asc' },
      ],
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination || isMotelAdmin) {
      return NextResponse.json(motels);
    }

    return NextResponse.json({
      data: motels,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          statusCounts,
          activeCounts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener datos financieros' },
      { status: 500 }
    );
  }
}
