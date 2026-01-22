import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdvertisementAdminUpdateSchema, IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/admin/advertisements/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
    const paramsResult = IdSchema.safeParse(id);
    if (!paramsResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const ad = await prisma.advertisement.findUnique({
      where: { id: paramsResult.data },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ad, {
      headers: { 'Cache-Control': 'no-store' },
    });
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
    const paramsResult = IdSchema.safeParse(id);
    if (!paramsResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdvertisementAdminUpdateSchema.parse(sanitized);

    const ad = await prisma.advertisement.update({
      where: { id: paramsResult.data },
      data: {
        title: validated.title,
        advertiser: validated.advertiser,
        imageUrl: validated.imageUrl,
        largeImageUrl: validated.largeImageUrl ?? null,
        description: validated.description ?? null,
        linkUrl: validated.linkUrl ?? null,
        placement: validated.placement,
        status: validated.status,
        priority: validated.priority,
        startDate: validated.startDate === null ? null : validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate === null ? null : validated.endDate ? new Date(validated.endDate) : undefined,
        maxViews: validated.maxViews ?? null,
        maxClicks: validated.maxClicks ?? null,
        viewCount: validated.viewCount,
        clickCount: validated.clickCount,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar anuncio' }, { status: 500 });
  }
}

// DELETE /api/admin/advertisements/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
    const paramsResult = IdSchema.safeParse(id);
    if (!paramsResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    await prisma.advertisement.delete({ where: { id: paramsResult.data } });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Advertisement',
      entityId: paramsResult.data,
      metadata: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json({ error: 'Error al eliminar anuncio' }, { status: 500 });
  }
}
