import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const {
      motelId,
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
      amenityIds
    } = body;

    if (!motelId || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: motelId, name' },
        { status: 400 }
      );
    }

    const room = await prisma.roomType.create({
      data: {
        motelId,
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
        hasJacuzzi: hasJacuzzi ?? false,
        hasPrivateGarage: hasPrivateGarage ?? false,
        isFeatured: isFeatured ?? false,
        isActive: true,
        amenities: amenityIds && amenityIds.length > 0
          ? {
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

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Room',
      entityId: room.id,
      metadata: { motelId: room.motelId, name: room.name },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Error al crear habitación' },
      { status: 500 }
    );
  }
}
