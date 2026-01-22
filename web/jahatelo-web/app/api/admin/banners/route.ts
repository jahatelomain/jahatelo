import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdminPaginationSchema, AdvertisementQuerySchema, AdvertisementSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/admin/advertisements?status=ACTIVE&placement=POPUP_HOME
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const queryResult = AdvertisementQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      placement: searchParams.get('placement') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { status, placement } = queryResult.data;
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

    const where = {
      status: status as any,
      placement: placement as any,
    };

    const total = await prisma.advertisement.count({ where });

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { analytics: true },
        },
      },
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(ads, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return NextResponse.json(
      {
        data: ads,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({ error: 'Error al obtener anuncios' }, { status: 500 });
  }
}

// POST /api/admin/advertisements
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdvertisementSchema.parse(sanitized);

    const ad = await prisma.advertisement.create({
      data: {
        title: validated.title,
        advertiser: validated.advertiser,
        imageUrl: validated.imageUrl,
        largeImageUrl: validated.largeImageUrl ?? null,
        description: validated.description ?? null,
        linkUrl: validated.linkUrl ?? null,
        placement: validated.placement,
        status: validated.status,
        priority: validated.priority ?? 0,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        maxViews: validated.maxViews ?? null,
        maxClicks: validated.maxClicks ?? null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Advertisement',
      entityId: ad.id,
      metadata: { placement: ad.placement, advertiser: ad.advertiser },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear anuncio' }, { status: 500 });
  }
}
