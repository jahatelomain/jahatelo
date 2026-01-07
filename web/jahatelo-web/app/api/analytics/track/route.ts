import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/analytics/track
 * Registra un evento de analytics para un motel
 * Endpoint público (no requiere autenticación)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motelId, eventType, source, userCity, userCountry, deviceType, metadata } = body;

    // Validar campos requeridos
    if (!motelId || !eventType) {
      return NextResponse.json(
        { error: 'motelId and eventType are required' },
        { status: 400 }
      );
    }

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

    // Validar eventType
    const validEventTypes = [
      'VIEW',
      'CLICK_PHONE',
      'CLICK_WHATSAPP',
      'CLICK_MAP',
      'CLICK_WEBSITE',
      'FAVORITE_ADD',
      'FAVORITE_REMOVE',
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType' },
        { status: 400 }
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
        metadata: metadata || null,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id,
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
