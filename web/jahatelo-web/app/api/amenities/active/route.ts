import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', data: [] }, { status: 400 });
    }

    const amenities = await prisma.amenity.findMany({
      where: {
        roomAmenities: {
          some: {
            roomType: {
              isActive: true,
              motel: { status: 'APPROVED', isActive: true },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        roomAmenities: {
          where: {
            roomType: {
              isActive: true,
              motel: { status: 'APPROVED', isActive: true },
            },
          },
          select: {
            roomType: { select: { motelId: true } },
          },
        },
      },
    });

    const mostUsed = amenities
      .map((amenity) => ({
        id: amenity.id,
        name: amenity.name,
        motelCount: new Set(amenity.roomAmenities.map(({ roomType }) => roomType.motelId)).size,
      }))
      .sort((a, b) => b.motelCount - a.motelCount || a.name.localeCompare(b.name, 'es'))
      .slice(0, parsed.data.limit);

    return NextResponse.json(
      { data: mostUsed },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('Error fetching active amenities:', error);
    return NextResponse.json(
      { error: 'Error al obtener amenities', data: [] },
      { status: 500 }
    );
  }
}
