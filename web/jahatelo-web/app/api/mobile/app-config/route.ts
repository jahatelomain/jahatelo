import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeObject } from '@/lib/sanitize';

const EventSchema = z.object({
  action: z.enum(['SHOWN', 'UPDATE_TAPPED', 'DISMISSED']),
  platform: z.enum(['ios', 'android']),
  currentVersion: z.string().min(1).max(30),
  targetVersion: z.string().min(1).max(30).optional(),
});

export async function GET() {
  const rows = await prisma.settings.findMany({
    where: { key: { in: ['app_minimum_version', 'app_recommended_version', 'app_update_message', 'app_ios_store_url', 'app_android_store_url'] } },
    select: { key: true, value: true },
  });
  const settings = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
  const minimumVersion = settings.app_minimum_version || process.env.MIN_APP_VERSION || '1.0.0';
  return NextResponse.json({
    minimumVersion,
    recommendedVersion: settings.app_recommended_version || process.env.RECOMMENDED_APP_VERSION || minimumVersion,
    message: settings.app_update_message || process.env.APP_UPDATE_MESSAGE || 'Actualizá Jahatelo para disfrutar mejoras y correcciones.',
    iosStoreUrl: settings.app_ios_store_url || process.env.IOS_STORE_URL || null,
    androidStoreUrl: settings.app_android_store_url || process.env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=app.jahatelo.mobile',
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = EventSchema.parse(sanitizeObject(await request.json()));
    await prisma.appUpdateEvent.create({ data });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
    console.error('Error tracking app update event:', error);
    return NextResponse.json({ error: 'No se pudo registrar el evento.' }, { status: 500 });
  }
}
