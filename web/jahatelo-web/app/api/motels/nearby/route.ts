import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
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
        { isFeatured: 'desc' },
        { ratingAvg: 'desc' },
      ],
    });

    return NextResponse.json({ motels });
  } catch (error) {
    console.error('Error fetching nearby motels:', error);
    return NextResponse.json(
      { error: 'Error fetching motels', motels: [] },
      { status: 500 }
    );
  }
}
