import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const QuerySchema = z.object({});

export async function GET(request: NextRequest) {
  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', data: [] }, { status: 400 });
    }

    const amenities = await prisma.amenity.findMany({
      where: {
        motelAmenities: {
          some: {
            motel: {
              status: 'APPROVED',
              isActive: true,
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ data: amenities });
  } catch (error) {
    console.error('Error fetching active amenities:', error);
    return NextResponse.json(
      { error: 'Error al obtener amenities', data: [] },
      { status: 500 }
    );
  }
}
