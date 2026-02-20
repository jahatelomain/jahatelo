import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveAnalyticsEnvironment } from '@/lib/analyticsEnvironment';

const TrackSchema = z.object({
  deviceId: z.string().min(8).max(64),
  platform: z.enum(['web', 'ios', 'android']),
  event: z.enum([
    'session_start',
    'page_view',
    'screen_view',
    'motel_view',
    'search',
    'city_view',
    'map_view',
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
    const body = await request.json();
    const parsed = TrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { deviceId, platform, event, path, referrer, metadata } = parsed.data;
    const environment = resolveAnalyticsEnvironment(request);
    const metadataWithEnvironment = {
      ...(metadata ?? {}),
      environment,
    };

    await prisma.visitorEvent.create({
      data: {
        deviceId,
        platform,
        event,
        path: path ?? null,
        referrer: referrer ?? null,
        metadata: metadataWithEnvironment as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Silencioso: el tracking nunca debe romper la experiencia del usuario
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
