import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

const UpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  note: z.string().trim().min(2).max(2000).optional(),
  resolutionSummary: z.string().trim().min(2).max(2000).nullable().optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), 'Sin cambios');

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
  if (access.error) return access.error;
  const { id } = await context.params;
  const parsed = UpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.motelReport.findUnique({ where: { id }, select: { id: true, motelId: true, status: true, assignedToId: true, resolutionSummary: true } });
  if (!before) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: parsed.data.assignedToId, role: 'SUPERADMIN', isActive: true }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: 'Responsable inválido' }, { status: 400 });
  }

  const terminal = parsed.data.status === 'RESOLVED' || parsed.data.status === 'DISMISSED';
  const report = await prisma.$transaction(async (tx) => {
    const updated = await tx.motelReport.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status, resolvedAt: terminal ? new Date() : null } : {}),
        ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId } : {}),
        ...(parsed.data.resolutionSummary !== undefined ? { resolutionSummary: parsed.data.resolutionSummary } : {}),
      },
      include: { motel: { select: { id: true, name: true, city: true } }, assignedTo: { select: { id: true, name: true, email: true } }, notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, name: true, email: true } } } } },
    });
    if (parsed.data.note && access.user?.id) await tx.motelReportNote.create({ data: { reportId: id, authorId: access.user.id, body: parsed.data.note } });
    return updated;
  });

  await logAuditEvent({ userId: access.user?.id, action: 'UPDATE', entityType: 'MotelReport', entityId: id, module: 'inbox', before, after: { status: report.status, assignedToId: report.assignedToId, resolutionSummary: report.resolutionSummary }, metadata: { motelId: before.motelId, noteAdded: Boolean(parsed.data.note), catalogCorrection: parsed.data.resolutionSummary || null } });
  return NextResponse.json({ report });
}
