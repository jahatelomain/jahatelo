import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { resolveAnalyticsEnvironment } from '@/lib/analyticsEnvironment';

type SummaryRow = {
  total_events: bigint; installations: bigint; sessions: bigint; identified_users: bigint;
  new_installations: bigint; returning_installations: bigint; page_views: bigint;
  bounced_sessions: bigint; average_session_minutes: number | null;
};

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
  if (access.error) return access.error;

  const requestedRange = Number(request.nextUrl.searchParams.get('range'));
  const days = [7, 30, 90].includes(requestedRange) ? requestedRange : 30;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const environment = resolveAnalyticsEnvironment(request);

  try {
    const [summaryRows, platforms, daily, topPaths, funnel, visitors] = await Promise.all([
      prisma.$queryRaw<SummaryRow[]>`
        WITH filtered AS (
          SELECT * FROM "VisitorEvent"
          WHERE "createdAt" >= ${since}
            AND ("path" IS NULL OR "path" NOT LIKE '/admin%')
            AND COALESCE("metadata"->>'environment', '') = ${environment}
        ), first_seen AS (
          SELECT "deviceId", MIN("createdAt") AS first_at
          FROM "VisitorEvent"
          WHERE COALESCE("metadata"->>'environment', '') = ${environment}
          GROUP BY "deviceId"
        ), session_stats AS (
          SELECT "sessionId", MIN("createdAt") AS started_at, MAX("createdAt") AS ended_at,
                 COUNT(*) FILTER (WHERE event <> 'session_start') AS meaningful_events
          FROM filtered WHERE "sessionId" IS NOT NULL GROUP BY "sessionId"
        )
        SELECT COUNT(*) AS total_events,
          COUNT(DISTINCT f."deviceId") AS installations,
          COUNT(DISTINCT f."sessionId") + COUNT(*) FILTER (WHERE f."sessionId" IS NULL AND f.event = 'session_start') AS sessions,
          COUNT(DISTINCT f."userId") AS identified_users,
          COUNT(DISTINCT f."deviceId") FILTER (WHERE fs.first_at >= ${since}) AS new_installations,
          COUNT(DISTINCT f."deviceId") FILTER (WHERE fs.first_at < ${since}) AS returning_installations,
          COUNT(*) FILTER (WHERE f.event IN ('page_view','screen_view')) AS page_views,
          COALESCE((SELECT COUNT(*) FROM session_stats WHERE meaningful_events <= 1), 0) AS bounced_sessions,
          COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0) FROM session_stats), 0)::float AS average_session_minutes
        FROM filtered f JOIN first_seen fs ON fs."deviceId" = f."deviceId"
      `,
      prisma.$queryRaw<{ platform: string; sessions: bigint; installations: bigint }[]>`
        SELECT platform, COUNT(DISTINCT "sessionId") AS sessions, COUNT(DISTINCT "deviceId") AS installations
        FROM "VisitorEvent" WHERE "createdAt" >= ${since}
          AND ("path" IS NULL OR "path" NOT LIKE '/admin%')
          AND COALESCE("metadata"->>'environment', '') = ${environment}
        GROUP BY platform ORDER BY installations DESC
      `,
      prisma.$queryRaw<{ day: Date; sessions: bigint; installations: bigint; events: bigint }[]>`
        WITH dates AS (SELECT generate_series(${since}::date, CURRENT_DATE, interval '1 day')::date AS day),
        counts AS (
          SELECT "createdAt"::date AS day, COUNT(DISTINCT "sessionId") AS sessions,
            COUNT(DISTINCT "deviceId") AS installations, COUNT(*) AS events
          FROM "VisitorEvent" WHERE "createdAt" >= ${since}
            AND ("path" IS NULL OR "path" NOT LIKE '/admin%')
            AND COALESCE("metadata"->>'environment', '') = ${environment}
          GROUP BY "createdAt"::date
        )
        SELECT dates.day, COALESCE(counts.sessions, 0) AS sessions,
          COALESCE(counts.installations, 0) AS installations, COALESCE(counts.events, 0) AS events
        FROM dates LEFT JOIN counts USING (day) ORDER BY dates.day
      `,
      prisma.$queryRaw<{ path: string; views: bigint }[]>`
        SELECT path, COUNT(*) AS views FROM "VisitorEvent"
        WHERE "createdAt" >= ${since} AND path IS NOT NULL AND path NOT LIKE '/admin%'
          AND event IN ('page_view','screen_view','motel_view')
          AND COALESCE("metadata"->>'environment', '') = ${environment}
        GROUP BY path ORDER BY views DESC LIMIT 10
      `,
      prisma.$queryRaw<{ stage: string; installations: bigint }[]>`
        WITH filtered AS (
          SELECT * FROM "VisitorEvent" WHERE "createdAt" >= ${since}
            AND ("path" IS NULL OR "path" NOT LIKE '/admin%')
            AND COALESCE("metadata"->>'environment', '') = ${environment}
        )
        SELECT stage, installations FROM (
          VALUES
            (1, 'Visitaron', (SELECT COUNT(DISTINCT "deviceId") FROM filtered)),
            (2, 'Exploraron', (SELECT COUNT(DISTINCT "deviceId") FROM filtered WHERE event IN ('search','city_view','map_view'))),
            (3, 'Vieron un motel', (SELECT COUNT(DISTINCT "deviceId") FROM filtered WHERE event = 'motel_view')),
            (4, 'Mostraron interés', (SELECT COUNT(DISTINCT "deviceId") FROM filtered WHERE event IN ('favorite_add','promo_view','promo_claim'))),
            (5, 'Contactaron', (SELECT COUNT(DISTINCT "deviceId") FROM filtered WHERE event IN ('phone_click','whatsapp_click','map_click','website_click','register_complete')))
        ) AS stages(position, stage, installations) ORDER BY position
      `,
      prisma.$queryRaw<Array<{
        device_id: string; first_seen: Date; last_seen: Date; events: bigint; sessions: bigint;
        platforms: string[]; user_id: string | null; user_name: string | null; user_email: string | null; last_path: string | null;
      }>>`
        WITH activity AS (
          SELECT "deviceId", MIN("createdAt") AS first_seen, MAX("createdAt") AS last_seen,
            COUNT(*) AS events, COUNT(DISTINCT "sessionId") AS sessions,
            ARRAY_AGG(DISTINCT platform) AS platforms,
            (ARRAY_AGG("userId" ORDER BY "createdAt" DESC) FILTER (WHERE "userId" IS NOT NULL))[1] AS user_id,
            (ARRAY_AGG(path ORDER BY "createdAt" DESC) FILTER (WHERE path IS NOT NULL))[1] AS last_path
          FROM "VisitorEvent" WHERE "createdAt" >= ${since}
            AND (path IS NULL OR path NOT LIKE '/admin%')
            AND COALESCE("metadata"->>'environment', '') = ${environment}
          GROUP BY "deviceId"
        )
        SELECT a."deviceId" AS device_id, a.first_seen, a.last_seen, a.events, a.sessions,
          a.platforms, a.user_id, u.name AS user_name, u.email AS user_email, a.last_path
        FROM activity a LEFT JOIN "User" u ON u.id = a.user_id
        ORDER BY a.last_seen DESC LIMIT 100
      `,
    ]);

    const summary = summaryRows[0];
    const sessionCount = Number(summary?.sessions ?? 0);
    const installations = Number(summary?.installations ?? 0);
    return NextResponse.json({
      period: { days, since: since.toISOString(), environment },
      summary: {
        totalEvents: Number(summary?.total_events ?? 0),
        installations,
        sessions: sessionCount,
        identifiedUsers: Number(summary?.identified_users ?? 0),
        newInstallations: Number(summary?.new_installations ?? 0),
        returningInstallations: Number(summary?.returning_installations ?? 0),
        returnRate: installations ? Math.round((Number(summary?.returning_installations ?? 0) / installations) * 100) : 0,
        pagesPerSession: sessionCount ? Math.round((Number(summary?.page_views ?? 0) / sessionCount) * 10) / 10 : 0,
        bounceRate: sessionCount ? Math.round((Number(summary?.bounced_sessions ?? 0) / sessionCount) * 100) : 0,
        averageSessionMinutes: Math.round(Number(summary?.average_session_minutes ?? 0) * 10) / 10,
      },
      platforms: platforms.map((row) => ({ platform: row.platform, sessions: Number(row.sessions), installations: Number(row.installations) })),
      daily: daily.map((row) => ({ day: row.day.toISOString().slice(0, 10), sessions: Number(row.sessions), installations: Number(row.installations), events: Number(row.events) })),
      topPaths: topPaths.map((row) => ({ path: row.path, views: Number(row.views) })),
      funnel: funnel.map((row) => ({ stage: row.stage, installations: Number(row.installations) })),
      visitors: visitors.map((row) => ({
        anonymousId: row.device_id,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
        events: Number(row.events),
        sessions: Number(row.sessions),
        platforms: row.platforms,
        lastPath: row.last_path,
        user: row.user_id ? { id: row.user_id, name: row.user_name, email: row.user_email } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de visitantes' }, { status: 500 });
  }
}
