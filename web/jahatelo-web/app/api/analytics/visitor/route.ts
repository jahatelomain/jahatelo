import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveAnalyticsEnvironment } from '@/lib/analyticsEnvironment';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { rateLimitUpstash } from '@/lib/rateLimit';

const TrackSchema = z.object({
  deviceId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64).optional(),
  eventId: z.string().min(8).max(64).optional(),
  platform: z.enum(['web', 'ios', 'android']),
  event: z.enum([
    'session_start',
    'page_view',
    'screen_view',
    'motel_view',
    'search',
    'city_view',
    'map_view',
    'favorite_add',
    'favorite_remove',
    'phone_click',
    'whatsapp_click',
    'map_click',
    'website_click',
    'promo_view',
    'promo_claim',
    'register_start',
    'register_complete',
  ]),
  path: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/analytics/visitor
// Registra un evento anonimo de visitante (web o app)
// Endpoint publico, no requiere autenticacion
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimitUpstash(`visitor-analytics:${ip}`, 180, 60_000);
    if (!limit.success) return NextResponse.json({ ok: false }, { status: 429 });
    const body = await request.json();
    const parsed = TrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { deviceId, sessionId, eventId, platform, event, path, referrer, metadata } = parsed.data;
    const token = await getTokenFromRequest(request);
    const authenticatedUser = token ? await verifyToken(token) : null;
    const environment = resolveAnalyticsEnvironment(request);
    const metadataWithEnvironment = {
      ...(metadata ?? {}),
      environment,
    };

    await prisma.visitorEvent.create({
      data: {
        deviceId,
        sessionId: sessionId ?? null,
        eventId: eventId ?? null,
        userId: authenticatedUser?.id ?? null,
        platform,
        event,
        path: path ?? null,
        referrer: referrer ?? null,
        metadata: metadataWithEnvironment as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // Silencioso: el tracking nunca debe romper la experiencia del usuario
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
