import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapMotelToDetail } from '../../mappers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validate slug
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid slug' },
        { status: 400 }
      );
    }

    // Common include for both queries
    const commonInclude = {
      photos: {
        orderBy: { order: 'asc' as const },
      },
      motelAmenities: {
        include: {
          amenity: true,
        },
      },
      rooms: {
        where: { isActive: true },
        include: {
          photos: {
            orderBy: { order: 'asc' as const },
          },
          roomPhotos: {
            orderBy: { order: 'asc' as const },
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
        },
      },
      menuCategories: {
        include: {
          items: {
            orderBy: { name: 'asc' as const },
          },
        },
        orderBy: { order: 'asc' as const },
      },
      promos: {
        where: { isActive: true },
      },
      paymentMethods: true,
      schedules: {
        orderBy: { dayOfWeek: 'asc' as const },
      },
    };

    // Try to find by slug first, then by id
    let motel = await prisma.motel.findUnique({
      where: { slug },
      include: commonInclude,
    });

    // If not found by slug, try by id
    if (!motel) {
      motel = await prisma.motel.findUnique({
        where: { id: slug },
        include: commonInclude,
      });
    }

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    // Check if motel is approved and active
    if (motel.status !== 'APPROVED' || !motel.isActive) {
      return NextResponse.json(
        { error: 'Motel not available' },
        { status: 404 }
      );
    }

    const data = mapMotelToDetail(motel);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/mobile/motels/[slug]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch motel' },
      { status: 500 }
    );
  }
}
