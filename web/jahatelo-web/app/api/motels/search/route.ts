import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const SearchParamsSchema = z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  amenities: z.string().max(500).optional(),
  promos: z.enum(['1']).optional(),
  featured: z.enum(['1']).optional(),
});

const getPlanPriority = (plan: string | null | undefined): number => {
  switch (plan) {
    case 'DIAMOND':
      return 1;
    case 'GOLD':
      return 2;
    case 'BASIC':
      return 3;
    case 'FREE':
      return 4;
    default:
      return 4;
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') ?? undefined;
    const city = searchParams.get('city') ?? undefined;
    const amenities = searchParams.get('amenities') ?? undefined;
    const promos = searchParams.get('promos') ?? undefined;
    const featured = searchParams.get('featured') ?? undefined;

    const parsed = SearchParamsSchema.safeParse({
      search,
      city,
      amenities,
      promos,
      featured,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', motels: [] },
        { status: 400 }
      );
    }

    const whereClause: Prisma.MotelWhereInput = {
      status: 'APPROVED',
      isActive: true,
    };

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
        {
          rooms: {
            some: {
              amenities: {
                some: {
                  amenity: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            },
          },
        },
      ];
    }

    if (amenities) {
      const amenityIds = amenities
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (amenityIds.length === 0) {
        return NextResponse.json(
          { error: 'Amenidades inválidas', motels: [] },
          { status: 400 }
        );
      }

      whereClause.rooms = {
        some: {
          amenities: {
            some: { amenityId: { in: amenityIds } },
          },
        },
      };
    }

    if (promos === '1') {
      whereClause.promos = {
        some: {
          isActive: true,
        },
      };
    }

    if (featured === '1') {
      whereClause.isFeatured = true;
    }

    const motels = await prisma.motel.findMany({
      where: whereClause,
      include: {
        photos: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        rooms: {
          where: { isActive: true },
          select: {
            price1h: true,
            price2h: true,
            price12h: true,
            amenities: {
              select: { amenity: { select: { id: true, name: true, icon: true } } },
            },
          },
        },
      },
      orderBy: [
        { plan: 'desc' },
        { isFeatured: 'desc' },
        { ratingAvg: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50, // Limit results
    });

    // Sanitize photos to ensure kind is always a string
    const sanitizedMotels = motels.map((motel) => ({
      ...motel,
      photos: motel.photos.map((photo) => ({
        url: photo.url,
        kind: photo.kind ?? 'OTHER',
      })),
    }));

    sanitizedMotels.sort((a, b) => {
      const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
      if (planDiff !== 0) return planDiff;
      const ratingDiff = (b.ratingAvg || 0) - (a.ratingAvg || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ motels: sanitizedMotels });
  } catch (error) {
    console.error('Error searching motels:', error);
    return NextResponse.json(
      { error: 'Error searching motels', motels: [] },
      { status: 500 }
    );
  }
}
