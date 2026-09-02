import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { resolveAnalyticsEnvironment } from '@/lib/analyticsEnvironment';

export async function GET(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
  if (access.error) return access.error;
  const { deviceId } = await params;
  if (!deviceId || deviceId.length > 64) return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
  const environment = resolveAnalyticsEnvironment(request);
  const events = await prisma.visitorEvent.findMany({
    where: { deviceId, metadata: { path: ['environment'], equals: environment } },
    orderBy: { createdAt: 'desc' },
    take: 250,
    select: {
      id: true, sessionId: true, platform: true, event: true, path: true, referrer: true,
      metadata: true, createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!events.length) return NextResponse.json({ error: 'Visitante no encontrado' }, { status: 404 });
  return NextResponse.json({ anonymousId: deviceId, events });
}
