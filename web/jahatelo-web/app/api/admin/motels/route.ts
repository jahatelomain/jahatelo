import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminPaginationSchema, EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = z
      .object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
        active: z.enum(['true', 'false']).optional(),
        q: z.string().max(100).optional(),
      })
      .safeParse({
        status: searchParams.get('status') || undefined,
        active: searchParams.get('active') || undefined,
        q: searchParams.get('q') || undefined,
      });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { status, active, q } = queryResult.data;

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
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const motelFilter =
      access.user?.role === 'MOTEL_ADMIN'
        ? access.user.motelId
          ? { id: access.user.motelId }
          : { id: '__invalid__' }
        : undefined;

    const searchFilter = q?.trim();
    const baseWhere: Prisma.MotelWhereInput = {
      ...(motelFilter ? motelFilter : {}),
      ...(searchFilter
        ? {
            OR: [
              { name: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { city: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { neighborhood: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactName: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactEmail: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
              { contactPhone: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const dataWhere: Prisma.MotelWhereInput = {
      ...baseWhere,
      ...(status ? { status } : {}),
      ...(active ? { isActive: active === 'true' } : {}),
    };

    const total = await prisma.motel.count({
      where: dataWhere,
    });

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
    const statusCounts = statusSummary.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count?._all ?? 0;
      return acc;
    }, {});
    const activeCounts = activeSummary.reduce<Record<string, number>>((acc, item) => {
      acc[item.isActive ? 'active' : 'inactive'] = item._count?._all ?? 0;
      return acc;
    }, {});

    const motels = await prisma.motel.findMany({
      where: dataWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        neighborhood: true,
        status: true,
        isActive: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        description: true,
        address: true,
        phone: true,
        whatsapp: true,
        featuredPhoto: true,
        featuredPhotoWeb: true,
        featuredPhotoApp: true,
        _count: {
          select: {
            photos: true,
            rooms: true,
            motelAmenities: true,
          },
        },
        createdAt: true,
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(motels ?? []);
    }

    return NextResponse.json({
      data: motels ?? [],
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
    console.error('Error fetching motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json([], { status: 500 });
  }
}
