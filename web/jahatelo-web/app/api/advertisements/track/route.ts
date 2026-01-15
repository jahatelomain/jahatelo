import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AdvertisementTrackSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

// POST /api/advertisements/track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { advertisementId, eventType, deviceType, userCity, userCountry, source } =
      AdvertisementTrackSchema.parse(sanitized);

    const ad = await prisma.advertisement.findUnique({ where: { id: advertisementId } });
    if (!ad) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    const isView = eventType === 'VIEW';
    const isClick = eventType === 'CLICK';

    await prisma.$transaction(async (tx) => {
      await tx.adAnalytics.create({
        data: {
          advertisementId,
          eventType,
          deviceType: deviceType || null,
          userCity: userCity || null,
          userCountry: userCountry || null,
          source: source || null,
        },
      });

      if (isView || isClick) {
        const updated = await tx.advertisement.update({
          where: { id: advertisementId },
          data: {
            viewCount: isView ? { increment: 1 } : undefined,
            clickCount: isClick ? { increment: 1 } : undefined,
          },
        });

        const reachedMaxViews = updated.maxViews !== null && updated.viewCount >= updated.maxViews;
        const reachedMaxClicks = updated.maxClicks !== null && updated.clickCount >= updated.maxClicks;

        if ((reachedMaxViews || reachedMaxClicks) && updated.status === 'ACTIVE') {
          await tx.advertisement.update({
            where: { id: advertisementId },
            data: { status: 'PAUSED' },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error tracking advertisement:', error);
    return NextResponse.json({ error: 'Error al registrar evento' }, { status: 500 });
  }
}
