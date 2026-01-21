import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    const citiesRaw = await prisma.motel.groupBy({
      by: ['city'],
      where: {
        status: 'APPROVED',
        isActive: true,
        city: {
          not: '',
        },
      },
      _count: {
        city: true,
      },
      orderBy: {
        city: 'asc',
      },
      take: 500,
    });

    const aggregated = new Map<string, number>();

    citiesRaw.forEach((item) => {
      const trimmed = (item.city || '').trim();
      if (!trimmed) return;
      aggregated.set(trimmed, (aggregated.get(trimmed) || 0) + item._count.city);
    });

    const cities = Array.from(aggregated.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities', cities: [] },
      { status: 500 }
    );
  }
}
