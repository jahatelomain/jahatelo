import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

// GET /api/admin/analytics/visitors?range=30
// Retorna estadsticas agregadas de visitantes annimos (VisitorEvent)
export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
  if (access.error) return access.error;

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get('range') ?? '30', 10) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [totalEvents, uniqueDevices, platformBreakdown, dailyRaw, topPaths, returningRaw] =
      await Promise.all([
        prisma.visitorEvent.count({ where: { createdAt: { gte: since } } }),

        prisma.visitorEvent.groupBy({
          by: ['deviceId'],
          where: { createdAt: { gte: since } },
          _count: { deviceId: true },
        }),

        prisma.visitorEvent.groupBy({
          by: ['platform'],
          where: { createdAt: { gte: since }, event: 'session_start' },
          _count: { platform: true },
          orderBy: { _count: { platform: 'desc' } },
        }),

        prisma.$queryRaw<{ day: Date; sessions: bigint; unique_devices: bigint }[]>`
          SELECT
            DATE_TRUNC('day', "createdAt") AS day,
            COUNT(*) AS sessions,
            COUNT(DISTINCT "deviceId") AS unique_devices
          FROM "VisitorEvent"
          WHERE event = 'session_start'
            AND "createdAt" >= ${since}
          GROUP BY day
          ORDER BY day ASC
        `,

        prisma.visitorEvent.groupBy({
          by: ['path'],
          where: {
            createdAt: { gte: since },
            event: { in: ['page_view', 'screen_view', 'motel_view'] },
            path: { not: null },
          },
          _count: { path: true },
          orderBy: { _count: { path: 'desc' } },
          take: 10,
        }),

        prisma.$queryRaw<{ returning: bigint; single_visit: bigint }[]>`
          SELECT
            COUNT(*) FILTER (WHERE session_count > 1) AS returning,
            COUNT(*) FILTER (WHERE session_count = 1) AS single_visit
          FROM (
            SELECT "deviceId", COUNT(*) AS session_count
            FROM "VisitorEvent"
            WHERE event = 'session_start'
              AND "createdAt" >= ${since}
            GROUP BY "deviceId"
          ) sub
        `,
      ]);

    const uniqueCount = uniqueDevices.length;
    const returningCount = Number(returningRaw[0]?.returning ?? 0);
    const newCount = Number(returningRaw[0]?.single_visit ?? 0);

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      summary: {
        totalEvents,
        uniqueDevices: uniqueCount,
        returningDevices: returningCount,
        newDevices: newCount,
        retentionRate: uniqueCount > 0 ? Math.round((returningCount / uniqueCount) * 100) : 0,
      },
      platforms: platformBreakdown.map((p) => ({
        platform: p.platform,
        sessions: p._count.platform,
      })),
      daily: dailyRaw.map((d) => ({
        day: (d.day as Date).toISOString().slice(0, 10),
        sessions: Number(d.sessions),
        uniqueDevices: Number(d.unique_devices),
      })),
      topPaths: topPaths.map((p) => ({
        path: p.path,
        views: p._count.path,
      })),
    });
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    return NextResponse.json({ error: 'Error al obtener estadsticas' }, { status: 500 });
  }
}
