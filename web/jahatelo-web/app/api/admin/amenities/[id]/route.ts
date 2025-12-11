import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET single amenity
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const amenity = await prisma.amenity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roomAmenities: true,
            motelAmenities: true,
          },
        },
      },
    });

    if (!amenity) {
      return NextResponse.json(
        { error: 'Amenity no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error fetching amenity:', error);
    return NextResponse.json(
      { error: 'Error al obtener amenity' },
      { status: 500 }
    );
  }
}

// PATCH update amenity
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Check if another amenity with the same name exists
    const existing = await prisma.amenity.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe otro amenity con ese nombre' },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenity.update({
      where: { id },
      data: {
        name,
        type: type || null,
      },
    });

    return NextResponse.json(amenity);
  } catch (error) {
    console.error('Error updating amenity:', error);
    return NextResponse.json(
      { error: 'Error al actualizar amenity' },
      { status: 500 }
    );
  }
}

// DELETE amenity
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const amenity = await prisma.amenity.findUnique({
      where: { id },
    });

    if (!amenity) {
      return NextResponse.json(
        { error: 'Amenity no encontrado' },
        { status: 404 }
      );
    }

    await prisma.motelAmenity.deleteMany({
      where: { amenityId: id },
    });

    await prisma.roomAmenity.deleteMany({
      where: { amenityId: id },
    });

    await prisma.amenity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting amenity:', error);
    return NextResponse.json(
      { error: 'Error al eliminar amenity' },
      { status: 500 }
    );
  }
}
