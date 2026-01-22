import { NextRequest, NextResponse } from 'next/server';
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
        status: z.enum(['ACTIVE', 'INACTIVE', 'DISABLED']).optional(),
        payment: z.enum(['DIRECT_DEBIT', 'TRANSFER', 'EXCHANGE']).optional(),
        search: z.string().max(100).optional(),
      })
      .safeParse({
        status: searchParams.get('status') || undefined,
        payment: searchParams.get('payment') || undefined,
        search: searchParams.get('search') || undefined,
      });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.errors }, { status: 400 });
    }
    const { status, payment, search: searchQuery } = queryResult.data;
    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: paginationResult.error.errors }, { status: 400 });
    }
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;
    EmptySchema.parse({});
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'financiero');
    if (access.error) return access.error;

    const searchFilter = searchQuery?.trim();
    const baseWhere = {
      ...(searchFilter
        ? {
            OR: [
              { name: { contains: searchFilter, mode: 'insensitive' } },
              { billingCompanyName: { contains: searchFilter, mode: 'insensitive' } },
              { billingTaxId: { contains: searchFilter, mode: 'insensitive' } },
              { adminContactName: { contains: searchFilter, mode: 'insensitive' } },
              { adminContactEmail: { contains: searchFilter, mode: 'insensitive' } },
              { adminContactPhone: { contains: searchFilter, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const dataWhere = {
      ...baseWhere,
      ...(status ? { financialStatus: status } : {}),
      ...(payment ? { paymentType: payment } : {}),
    };
    const total = await prisma.motel.count({ where: dataWhere });

    const statusSummary = await prisma.motel.groupBy({
      by: ['financialStatus'],
      _count: { _all: true },
      where: baseWhere,
    });
    const paymentSummary = await prisma.motel.groupBy({
      by: ['paymentType'],
      _count: { _all: true },
      where: baseWhere,
    });
    const statusCounts = statusSummary.reduce<Record<string, number>>((acc, item) => {
      acc[item.financialStatus] = item._count._all;
      return acc;
    }, {});
    const paymentCounts = paymentSummary.reduce<Record<string, number>>((acc, item) => {
      if (!item.paymentType) return acc;
      acc[item.paymentType] = item._count._all;
      return acc;
    }, {});

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
        { financialStatus: 'asc' },
        { name: 'asc' },
      ],
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
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
          paymentCounts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener datos financieros' },
      { status: 500 }
    );
  }
}
