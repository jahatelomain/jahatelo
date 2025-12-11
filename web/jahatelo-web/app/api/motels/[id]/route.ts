import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const motel = await prisma.motel.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            amenities: {
              include: {
                amenity: true,
              },
            },
            photos: true,
          },
        },
        menuCategories: {
          include: {
            items: true,
          },
        },
        motelAmenities: {
          include: {
            amenity: true,
          },
        },
        photos: true,
      },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(motel);
  } catch (error) {
    console.error('Error in GET /api/motels/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch motel' },
      { status: 500 }
    );
  }
}
