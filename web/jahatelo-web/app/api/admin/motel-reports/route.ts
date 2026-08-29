import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
  if (access.error) return access.error;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = 20;
  const status = params.get('status');
  const reason = params.get('reason');
  const query = params.get('query')?.trim();
  const assignedToId = params.get('assignedToId');
  const where: Prisma.MotelReportWhereInput = {
    ...(status && status !== 'ALL' ? { status: status as Prisma.EnumMotelReportStatusFilter } : {}),
    ...(reason && reason !== 'ALL' ? { reason: reason as Prisma.EnumMotelReportReasonFilter } : {}),
    ...(assignedToId === 'UNASSIGNED' ? { assignedToId: null } : assignedToId ? { assignedToId } : {}),
    ...(query ? { motel: { name: { contains: query, mode: 'insensitive' } } } : {}),
  };

  const [reports, total, grouped, assignees] = await Promise.all([
    prisma.motelReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        motel: { select: { id: true, name: true, city: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.motelReport.count({ where }),
    prisma.motelReport.groupBy({ by: ['status'], _count: true }),
    prisma.user.findMany({ where: { role: 'SUPERADMIN', isActive: true }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({ reports, assignees, summary: Object.fromEntries(grouped.map((item) => [item.status, item._count])), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
}
