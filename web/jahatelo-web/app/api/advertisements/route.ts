import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/advertisements?placement=POPUP_HOME
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json({ error: 'placement es requerido' }, { status: 400 });
    }

    const now = new Date();
    const ads = await prisma.advertisement.findMany({
      where: {
        placement: placement as any,
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

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({ error: 'Error al obtener anuncios' }, { status: 500 });
  }
}
