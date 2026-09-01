import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { calculateReportMetrics } from '@/lib/reportMetrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
  if (access.error) return access.error;

  const requestedDays = Number(request.nextUrl.searchParams.get('days'));
  const days = [30, 90, 365].includes(requestedDays) ? requestedDays : 30;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);

  const reports = await prisma.motelReport.findMany({
    where: { createdAt: { gte: since } },
    select: {
      createdAt: true,
      resolvedAt: true,
      status: true,
      reason: true,
      motel: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ days, since, ...calculateReportMetrics(reports) });
}
