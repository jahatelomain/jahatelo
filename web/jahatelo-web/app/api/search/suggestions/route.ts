import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SearchSuggestionQuerySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = SearchSuggestionQuerySchema.safeParse({
      q: searchParams.get('q')?.trim(),
    });
    if (!queryResult.success) {
      return NextResponse.json({ suggestions: [] });
    }
    const query = queryResult.data.q;

    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, name: true, city: true, neighborhood: true, slug: true },
      take: 5,
    });

    const cities = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        city: { contains: query, mode: 'insensitive' },
      },
      select: { city: true },
      distinct: ['city'],
      take: 5,
    });

    const neighborhoods = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        neighborhood: { contains: query, mode: 'insensitive' },
      },
      select: { neighborhood: true },
      distinct: ['neighborhood'],
      take: 5,
    });

    const suggestions = [
      ...motels.map((motel) => ({
        type: 'motel',
        id: motel.id,
        label: motel.name,
        subtitle: `${motel.city}, ${motel.neighborhood}`,
        slug: motel.slug,
      })),
      ...cities.map((item) => ({
        type: 'city',
        label: item.city,
      })),
      ...neighborhoods.map((item) => ({
        type: 'neighborhood',
        label: item.neighborhood,
      })),
    ];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ suggestions: [] }, { status: 400 });
    }
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
