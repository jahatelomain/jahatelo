import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/admin/advertisements?status=ACTIVE&placement=POPUP_HOME
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const placement = searchParams.get('placement') || undefined;

    const ads = await prisma.advertisement.findMany({
      where: {
        status: status as any,
        placement: placement as any,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { analytics: true },
        },
      },
    });

    return NextResponse.json(ads, {
      headers: { 'Cache-Control': 'no-store' },
    });
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
    const {
      title,
      advertiser,
      imageUrl,
      largeImageUrl,
      description,
      linkUrl,
      placement,
      status,
      priority,
      startDate,
      endDate,
      maxViews,
      maxClicks,
    } = body;

    if (!title || !advertiser || !imageUrl || !placement) {
      return NextResponse.json({ error: 'title, advertiser, imageUrl y placement son requeridos' }, { status: 400 });
    }

    const ad = await prisma.advertisement.create({
      data: {
        title,
        advertiser,
        imageUrl,
        largeImageUrl: largeImageUrl || null,
        description: description || null,
        linkUrl: linkUrl || null,
        placement,
        status: status || 'ACTIVE',
        priority: Number.isFinite(priority) ? Number(priority) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxViews: Number.isFinite(maxViews) ? Number(maxViews) : null,
        maxClicks: Number.isFinite(maxClicks) ? Number(maxClicks) : null,
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
    return NextResponse.json({ error: 'Error al crear anuncio' }, { status: 500 });
  }
}
