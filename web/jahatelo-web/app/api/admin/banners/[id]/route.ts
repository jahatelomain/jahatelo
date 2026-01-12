import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

// GET /api/admin/advertisements/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
    const ad = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    return NextResponse.json({ error: 'Error al obtener anuncio' }, { status: 500 });
  }
}

// PATCH /api/admin/advertisements/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
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
      viewCount,
      clickCount,
    } = body;

    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        title,
        advertiser,
        imageUrl,
        largeImageUrl: largeImageUrl ?? null,
        description: description ?? null,
        linkUrl: linkUrl ?? null,
        placement,
        status,
        priority: Number.isFinite(priority) ? Number(priority) : undefined,
        startDate: startDate === null ? null : startDate ? new Date(startDate) : undefined,
        endDate: endDate === null ? null : endDate ? new Date(endDate) : undefined,
        maxViews: Number.isFinite(maxViews) ? Number(maxViews) : maxViews === null ? null : undefined,
        maxClicks: Number.isFinite(maxClicks) ? Number(maxClicks) : maxClicks === null ? null : undefined,
        viewCount: Number.isFinite(viewCount) ? Number(viewCount) : undefined,
        clickCount: Number.isFinite(clickCount) ? Number(clickCount) : undefined,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Advertisement',
      entityId: ad.id,
      metadata: { placement: ad.placement, status: ad.status },
    });

    return NextResponse.json(ad);
  } catch (error) {
    console.error('Error updating advertisement:', error);
    return NextResponse.json({ error: 'Error al actualizar anuncio' }, { status: 500 });
  }
}

// DELETE /api/admin/advertisements/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
    await prisma.advertisement.delete({ where: { id } });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Advertisement',
      entityId: id,
      metadata: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json({ error: 'Error al eliminar anuncio' }, { status: 500 });
  }
}
