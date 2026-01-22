import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET() {
  try {
    EmptySchema.parse({});
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
        { plan: 'desc' },
        { isFeatured: 'desc' },
        { ratingAvg: 'desc' },
      ],
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
    console.error('Error fetching nearby motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues, motels: [] }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error fetching motels', motels: [] },
      { status: 500 }
    );
  }
}
