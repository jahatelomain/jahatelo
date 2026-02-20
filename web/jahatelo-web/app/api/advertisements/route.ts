import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PublicAdvertisementQuerySchema } from '@/lib/validations/schemas';
import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/advertisements?placement=POPUP_HOME
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = PublicAdvertisementQuerySchema.safeParse({
      placement: searchParams.get('placement'),
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { placement } = queryResult.data;
    const baseUrl = request.headers.get('origin') || new URL(request.url).origin;

    const now = new Date();
    const ads = await prisma.advertisement.findMany({
      where: {
        placement,
        status: 'ACTIVE',
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const filtered = ads.filter((ad) => {
      const withinViews = ad.maxViews === null || ad.viewCount < ad.maxViews;
      const withinClicks = ad.maxClicks === null || ad.clickCount < ad.maxClicks;
      return withinViews && withinClicks;
    });

    // Agrega ?v=timestamp para cache-busting en React Native.
    // El timestamp cambia cuando el anuncio se edita, forzando la recarga de la imagen.
    const addV = (url: string | null, updatedAt: Date) => {
      if (!url) return null;
      const normalized = normalizeLocalUrl(url, baseUrl);
      if (!normalized) return null;
      const sep = normalized.includes('?') ? '&' : '?';
      return `${normalized}${sep}v=${updatedAt.getTime()}`;
    };

    const normalized = filtered.map((ad) => ({
      ...ad,
      imageUrl: addV(ad.imageUrl, ad.updatedAt),
      largeImageUrl: addV(ad.largeImageUrl, ad.updatedAt),
      largeImageUrlWeb: addV(ad.largeImageUrlWeb, ad.updatedAt),
      largeImageUrlApp: addV(ad.largeImageUrlApp, ad.updatedAt),
    }));

    return NextResponse.json(normalized, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al obtener anuncios' }, { status: 500 });
  }
}
