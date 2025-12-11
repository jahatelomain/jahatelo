import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const {
      name,
      description,
      basePrice,
      priceLabel,
      price1h,
      price1_5h,
      price2h,
      price3h,
      price12h,
      price24h,
      priceNight,
      maxPersons,
      hasJacuzzi,
      hasPrivateGarage,
      isFeatured,
      isActive,
      amenityIds
    } = body;

    // Update room and replace amenities
    const room = await prisma.roomType.update({
      where: { id },
      data: {
        name,
        description,
        basePrice: basePrice ? parseInt(basePrice) : null,
        priceLabel,
        price1h: price1h ? parseInt(price1h) : null,
        price1_5h: price1_5h ? parseInt(price1_5h) : null,
        price2h: price2h ? parseInt(price2h) : null,
        price3h: price3h ? parseInt(price3h) : null,
        price12h: price12h ? parseInt(price12h) : null,
        price24h: price24h ? parseInt(price24h) : null,
        priceNight: priceNight ? parseInt(priceNight) : null,
        maxPersons: maxPersons ? parseInt(maxPersons) : null,
        hasJacuzzi: hasJacuzzi ?? undefined,
        hasPrivateGarage: hasPrivateGarage ?? undefined,
        isFeatured: isFeatured ?? undefined,
        isActive: isActive ?? undefined,
        amenities: amenityIds !== undefined
          ? {
              deleteMany: {},
              create: amenityIds.map((amenityId: string) => ({
                amenityId,
              })),
            }
          : undefined,
      },
      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Error al actualizar habitación' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    await prisma.roomType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Error al eliminar habitación' },
      { status: 500 }
    );
  }
}
