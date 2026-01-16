import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AnalyticsTrackSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * POST /api/analytics/track
 * Registra un evento de analytics para un motel
 * Endpoint público (no requiere autenticación)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { motelId, eventType, source, userCity, userCountry, deviceType, metadata } =
      AnalyticsTrackSchema.parse(sanitized);
    const metadataValue = metadata ?? undefined;

    // Validar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { id: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    // Crear registro de analytics
    const analyticsEvent = await prisma.motelAnalytics.create({
      data: {
        motelId,
        eventType,
        source: source || null,
        userCity: userCity || null,
        userCountry: userCountry || null,
        deviceType: deviceType || null,
        metadata: metadataValue,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
