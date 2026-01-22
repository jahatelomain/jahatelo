import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    EmptySchema.parse({});
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch cities', cities: [] },
      { status: 500 }
    );
  }
}
