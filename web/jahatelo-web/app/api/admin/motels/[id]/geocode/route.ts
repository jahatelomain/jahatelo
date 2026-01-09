import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geocoding';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/motels/[id]/geocode
 *
 * Geocodes a motel's address and updates its coordinates
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    // Get motel from database
    const motel = await prisma.motel.findUnique({
      where: { id },
      select: {
        id: true,
        address: true,
        city: true,
        country: true,
      },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    if (!motel.address || !motel.city) {
      return NextResponse.json(
        { error: 'Motel must have address and city to geocode' },
        { status: 400 }
      );
    }

    // Geocode the address
    const result = await geocodeAddress(
      motel.address,
      motel.city,
      motel.country || 'Paraguay'
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode address. Please verify the address is correct.' },
        { status: 400 }
      );
    }

    // Update motel with coordinates
    const updatedMotel = await prisma.motel.update({
      where: { id },
      data: {
        latitude: result.lat,
        longitude: result.lng,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Motel',
      entityId: updatedMotel.id,
      metadata: {
        action: 'GEOCODE',
        address: updatedMotel.address,
        city: updatedMotel.city,
        latitude: updatedMotel.latitude,
        longitude: updatedMotel.longitude,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Motel geocoded successfully',
      motel: updatedMotel,
      formattedAddress: result.formattedAddress,
    });
  } catch (error) {
    console.error('Error geocoding motel:', error);
    return NextResponse.json(
      {
        error: 'Failed to geocode motel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
