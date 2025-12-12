import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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
          },
        },
        menuCategories: {
          include: {
            items: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        photos: true,
        motelAmenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(motel);
  } catch (error) {
    console.error('Error fetching motel:', error);
    return NextResponse.json(
      { error: 'Error al obtener motel' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    const data = { ...body };
    if (!data.nextBillingAt) {
      data.nextBillingAt = null;
    } else {
      data.nextBillingAt = new Date(data.nextBillingAt).toISOString();
    }

    const motel = await prisma.motel.update({
      where: { id },
      data,
    });

    return NextResponse.json(motel);
  } catch (error) {
    console.error('Error updating motel:', error);
    return NextResponse.json(
      { error: 'Error al actualizar motel' },
      { status: 500 }
    );
  }
}
