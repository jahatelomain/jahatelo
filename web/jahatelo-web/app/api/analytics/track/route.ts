import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AnalyticsTrackSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { resolveAnalyticsEnvironment } from '@/lib/analyticsEnvironment';
import { z } from 'zod';
import { rateLimitUpstash } from '@/lib/rateLimit';

/**
 * POST /api/analytics/track
 * Registra un evento de analytics para un motel
 * Endpoint público (no requiere autenticación)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimitUpstash(`motel-analytics:${ip}`, 180, 60_000);
    if (!limit.success) return NextResponse.json({ success: false }, { status: 429 });
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { motelId, eventId, deviceId, sessionId, eventType, source, userCity, userCountry, deviceType, metadata } =
      AnalyticsTrackSchema.parse(sanitized);
    const environment = resolveAnalyticsEnvironment(request);
    const edgeCity = request.headers.get('x-vercel-ip-city');
    const resolvedCity = userCity || (edgeCity ? decodeURIComponent(edgeCity) : null);
    const resolvedCountry = userCountry || request.headers.get('x-vercel-ip-country');
    const metadataValue: Prisma.InputJsonValue = {
      ...(metadata ? (metadata as Record<string, unknown>) : {}),
      environment,
    };

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
        eventId: eventId || null,
        deviceId: deviceId || null,
        sessionId: sessionId || null,
        environment,
        eventType,
        source: source || null,
        userCity: resolvedCity,
        userCountry: resolvedCountry,
        deviceType: deviceType || null,
        metadata: metadataValue,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: true, duplicate: true });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
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
