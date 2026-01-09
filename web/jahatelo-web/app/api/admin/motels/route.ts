import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const motels = await prisma.motel.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        neighborhood: true,
        status: true,
        isActive: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        description: true,
        address: true,
        phone: true,
        whatsapp: true,
        featuredPhoto: true,
        _count: {
          select: {
            photos: true,
            rooms: true,
            motelAmenities: true,
          },
        },
        createdAt: true,
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(motels ?? []);
  } catch (error) {
    console.error('Error fetching motels:', error);
    return NextResponse.json([], { status: 500 });
  }
}
