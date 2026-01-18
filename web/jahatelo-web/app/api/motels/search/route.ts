import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const amenities = searchParams.get('amenities');

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
          motelAmenities: {
            some: {
              amenity: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    if (amenities) {
      const amenityIds = amenities.split(',');
      whereClause.motelAmenities = {
        some: {
          amenityId: {
            in: amenityIds,
          },
        },
      };
    }

    const motels = await prisma.motel.findMany({
      where: whereClause,
      include: {
        photos: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        motelAmenities: {
          take: 3,
          include: {
            amenity: true,
          },
        },
        rooms: {
          where: { isActive: true },
          select: {
            price1h: true,
            price2h: true,
            price12h: true,
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

    return NextResponse.json({ motels: sanitizedMotels });
  } catch (error) {
    console.error('Error searching motels:', error);
    return NextResponse.json(
      { error: 'Error searching motels', motels: [] },
      { status: 500 }
    );
  }
}
