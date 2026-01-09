import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

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
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
