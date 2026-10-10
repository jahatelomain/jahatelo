import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimitUpstash } from '@/lib/rateLimit';
import { planFeaturedSlides, planPopupSlides } from '@/lib/homeRotation';
import { claimRotationTicket } from '@/lib/homeRotationTicket';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ClaimSchema = z.object({
  scope: z.enum(['POPUP_HOME', 'FEATURED_HOME']),
  visitId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = ClaimSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    const { scope, visitId } = parsed.data;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const fingerprint = createHash('sha256').update(ip).digest('hex');
    const limit = await rateLimitUpstash(`home-rotation:${fingerprint}`, 300, 60_000);
    if (!limit.success) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const now = new Date();
    const [motels, eligibleAds] = await Promise.all([
      scope === 'FEATURED_HOME'
        ? prisma.motel.findMany({
            where: { isFeatured: true, isActive: true, status: 'APPROVED' },
            select: { id: true },
          })
        : Promise.resolve([]),
      prisma.advertisement.findMany({
        where: {
          placement: scope === 'POPUP_HOME' ? 'POPUP_HOME' : 'CAROUSEL',
          status: 'ACTIVE',
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        select: { id: true, viewCount: true, clickCount: true, maxViews: true, maxClicks: true },
      }),
    ]);
    const adIds = eligibleAds
      .filter((ad) => (ad.maxViews === null || ad.viewCount < ad.maxViews)
        && (ad.maxClicks === null || ad.clickCount < ad.maxClicks))
      .map((ad) => ad.id);
    if (!motels.length && !adIds.length) return NextResponse.json({ slides: [] }, { headers: { 'Cache-Control': 'no-store' } });

    const ticket = await claimRotationTicket(prisma, scope, visitId);
    const slides = scope === 'POPUP_HOME'
      ? planPopupSlides(adIds, ticket)
      : planFeaturedSlides(motels.map((motel) => motel.id), adIds, ticket);
    return NextResponse.json({ slides }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error assigning home carousel rotation:', error);
    return NextResponse.json({ error: 'No se pudo cargar el carrusel' }, { status: 500 });
  }
}
