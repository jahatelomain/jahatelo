import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { mapMotelToListItem } from '../mappers';

// Helper to normalize text: lowercase + remove accents (NFD normalization)
const normalize = (value?: string) =>
  value
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') || undefined;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const search = searchParams.get('search') || undefined;
    const city = searchParams.get('city') || undefined;
    const neighborhood = searchParams.get('neighborhood') || undefined;
    const amenity = searchParams.get('amenity') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const idsParam = searchParams.get('ids') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Normalize all text filters
    const searchNormalized = normalize(search);
    const cityNormalized = normalize(city);
    const neighborhoodNormalized = normalize(neighborhood);
    const amenityNormalized = normalize(amenity);

    // Build where clause
    const where: Prisma.MotelWhereInput = {
      status: 'APPROVED',
      isActive: true,
    };

    // Accumulate OR conditions
    const orConditions: Prisma.MotelWhereInput[] = [];

    // Search: match in name, description, city, neighborhood
    if (searchNormalized) {
      orConditions.push(
        { name: { contains: searchNormalized } },
        { description: { contains: searchNormalized } },
        { city: { contains: searchNormalized } },
        { neighborhood: { contains: searchNormalized } }
      );
    }

    // IDs filter: can be ids or slugs (add to OR without overwriting)
    if (idsParam) {
      const idsArray = idsParam.split(',').map((id) => id.trim());
      orConditions.push({ id: { in: idsArray } }, { slug: { in: idsArray } });
    }

    // Assign OR conditions if any
    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Specific filters (AND conditions)
    if (cityNormalized) {
      where.city = { equals: cityNormalized };
    }

    if (neighborhoodNormalized) {
      where.neighborhood = { equals: neighborhoodNormalized };
    }

    if (amenityNormalized) {
      where.motelAmenities = {
        some: {
          amenity: {
            name: { contains: amenityNormalized },
          },
        },
      };
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [total, motels] = await Promise.all([
      prisma.motel.count({ where }),
      prisma.motel.findMany({
        where,
        include: {
          photos: {
            orderBy: { order: 'asc' },
          },
          motelAmenities: {
            include: {
              amenity: true,
            },
          },
          rooms: {
            where: { isActive: true },
            select: {
              price1h: true,
              price1_5h: true,
              price2h: true,
              price3h: true,
              price12h: true,
              price24h: true,
              priceNight: true,
              isActive: true,
            },
          },
          promos: {
            where: { isActive: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { ratingAvg: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    // Map motels to mobile format
    const data = motels.map(mapMotelToListItem);

    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/motels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch motels' },
      { status: 500 }
    );
  }
}
