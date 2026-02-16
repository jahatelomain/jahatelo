import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

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

    sanitizedMotels.sort((a, b) => {
      const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
      if (planDiff !== 0) return planDiff;
      const ratingDiff = (b.ratingAvg || 0) - (a.ratingAvg || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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
