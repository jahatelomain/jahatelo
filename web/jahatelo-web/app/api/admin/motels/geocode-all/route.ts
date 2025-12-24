import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { geocodeMultipleAddresses } from '@/lib/geocoding';

/**
 * POST /api/admin/motels/geocode-all
 *
 * Geocodes all motels that don't have coordinates yet
 */
export async function POST() {
  try {
    // Get all motels without coordinates
    const motels = await prisma.motel.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
      },
    });

    if (motels.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All motels already have coordinates',
        geocoded: 0,
        failed: 0,
      });
    }

    // Prepare addresses for geocoding
    const addresses = motels.map(motel => ({
      address: motel.address,
      city: motel.city,
      country: motel.country || 'Paraguay',
    }));

    // Geocode all addresses with rate limiting (200ms delay between requests)
    const results = await geocodeMultipleAddresses(addresses, 200);

    // Update motels with coordinates
    const updates = [];
    const failed = [];

    for (let i = 0; i < motels.length; i++) {
      const motel = motels[i];
      const result = results[i];

      if (result) {
        updates.push({
          id: motel.id,
          name: motel.name,
          latitude: result.lat,
          longitude: result.lng,
        });
      } else {
        failed.push({
          id: motel.id,
          name: motel.name,
          address: motel.address,
          city: motel.city,
        });
      }
    }

    // Batch update all successful geocodes
    if (updates.length > 0) {
      await Promise.all(
        updates.map(update =>
          prisma.motel.update({
            where: { id: update.id },
            data: {
              latitude: update.latitude,
              longitude: update.longitude,
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: `Geocoded ${updates.length} motels`,
      geocoded: updates.length,
      failed: failed.length,
      failedMotels: failed,
    });
  } catch (error) {
    console.error('Error batch geocoding motels:', error);
    return NextResponse.json(
      {
        error: 'Failed to geocode motels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
