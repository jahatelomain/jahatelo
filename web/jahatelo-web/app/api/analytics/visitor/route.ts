import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
  metadata: z.record(z.unknown()).optional(),
});

// POST /api/analytics/visitor
// Registra un evento anónimo de visitante (web o app)
// Endpoint público, no requiere autenticación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = TrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { deviceId, platform, event, path, referrer, metadata } = parsed.data;

    await prisma.visitorEvent.create({
      data: {
        deviceId,
        platform,
        event,
        path: path ?? null,
        referrer: referrer ?? null,
        metadata: metadata ? (metadata as object) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Silencioso  el tracking nunca debe romper la experiencia del usuario
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
