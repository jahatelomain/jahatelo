import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { geocodeMultipleAddresses } from '@/lib/geocoding';
import { findOfficialGooglePlace } from '@/lib/googlePlaces';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

/**
 * POST /api/admin/motels/geocode-all
 *
 * Geocodes all motels that don't have coordinates yet
 */
export async function POST(request: Request) {
  try {
    EmptySchema.parse({});
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

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
        mapUrl: true,
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

    // Update motels with coordinates. Prefer the official Google place when a
    // map URL is present; this resolves short maps.app.goo.gl links that do not
    // contain coordinates themselves. Fall back to address geocoding.
    const updates: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      googlePlaceId?: string;
      mapUrl?: string;
    }> = [];
    const failed = [];

    for (let i = 0; i < motels.length; i++) {
      const motel = motels[i];
      let result = results[i];
      let googlePlaceId: string | undefined;
      let canonicalMapUrl: string | undefined;

      if (motel.mapUrl) {
        const place = await findOfficialGooglePlace({
          name: motel.name,
          address: motel.address,
          city: motel.city,
          country: motel.country || 'Paraguay',
        });
        if (place) {
          result = { lat: place.latitude, lng: place.longitude };
          googlePlaceId = place.id;
          canonicalMapUrl = place.googleMapsUri || undefined;
        }
      }

      if (result) {
        updates.push({
          id: motel.id,
          name: motel.name,
          latitude: result.lat,
          longitude: result.lng,
          googlePlaceId,
          mapUrl: canonicalMapUrl,
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
      for (const update of updates) {
        await prisma.motel.update({
          where: { id: update.id },
          data: {
            latitude: update.latitude,
            longitude: update.longitude,
            ...(update.googlePlaceId ? { googlePlaceId: update.googlePlaceId } : {}),
            ...(update.mapUrl ? { mapUrl: update.mapUrl } : {}),
          },
        });
      }
    }

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Motel',
      entityId: null,
      metadata: {
        action: 'GEOCODE_BATCH',
        geocoded: updates.length,
        failed: failed.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Geocoded ${updates.length} motels`,
      geocoded: updates.length,
      failed: failed.length,
      failedMotels: failed,
    });
  } catch (error) {
    console.error('Error batch geocoding motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'Failed to geocode motels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
