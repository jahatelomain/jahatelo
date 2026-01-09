import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AMENITY_ICONS } from '@/lib/amenityIcons';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

// GET all amenities
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;

    const amenities = await prisma.amenity.findMany({
      include: {
        motelAmenities: {
          include: {
            motel: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        _count: {
          select: {
            roomAmenities: true,
            motelAmenities: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(amenities ?? []);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST create new amenity
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;

    const body = await request.json();
    const { name, type, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Check if amenity already exists
    const existing = await prisma.amenity.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un amenity con ese nombre' },
        { status: 400 }
      );
    }

    if (icon && !AMENITY_ICONS.some((item) => item.value === icon)) {
      return NextResponse.json(
        { error: 'Ícono inválido' },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenity.create({
      data: {
        name,
        type: type || null,
        icon: icon || null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Amenity',
      entityId: amenity.id,
      metadata: { name: amenity.name },
    });

    return NextResponse.json(amenity, { status: 201 });
  } catch (error) {
    console.error('Error creating amenity:', error);
    return NextResponse.json(
      { error: 'Error al crear amenity' },
      { status: 500 }
    );
  }
}
