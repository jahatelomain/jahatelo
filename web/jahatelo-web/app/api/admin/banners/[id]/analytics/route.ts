import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

const VALID_PERIODS = new Set([7, 30, 90]);

// GET /api/admin/advertisements/[id]/analytics?period=30
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'banners');
    if (access.error) return access.error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const periodParam = Number(searchParams.get('period') || 30);
    const periodDays = VALID_PERIODS.has(periodParam) ? periodParam : 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodDays);

    const events = await prisma.adAnalytics.findMany({
      where: {
        advertisementId: id,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 2000,
    });

    const summary = {
      totalViews: 0,
      totalClicks: 0,
      ctr: 0,
    };

    const viewsByDay: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    events.forEach((event) => {
      const dayKey = event.timestamp.toISOString().slice(0, 10);
      if (!viewsByDay[dayKey]) viewsByDay[dayKey] = 0;
      if (event.eventType === 'VIEW') summary.totalViews += 1;
      if (event.eventType === 'CLICK') summary.totalClicks += 1;

      viewsByDay[dayKey] += 1;

      const deviceKey = event.deviceType || 'DESCONOCIDO';
      byDevice[deviceKey] = (byDevice[deviceKey] || 0) + 1;

      const sourceKey = event.source || 'GENERAL';
      bySource[sourceKey] = (bySource[sourceKey] || 0) + 1;
    });

    summary.ctr = summary.totalViews > 0 ? Number(((summary.totalClicks / summary.totalViews) * 100).toFixed(2)) : 0;

    const sortedViewsByDay = Object.entries(viewsByDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, count]) => ({ date, count }));

    const sortedByDevice = Object.entries(byDevice)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const sortedBySource = Object.entries(bySource)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      period: {
        days: periodDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary,
      charts: {
        viewsByDay: sortedViewsByDay,
        byDevice: sortedByDevice,
        bySource: sortedBySource,
      },
      recentEvents: events.slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching advertisement analytics:', error);
    return NextResponse.json({ error: 'Error al obtener analíticas' }, { status: 500 });
  }
}
