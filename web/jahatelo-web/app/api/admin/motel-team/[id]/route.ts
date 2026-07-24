import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  const { id } = await params;
  const body = await request.json();
  if (typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  if (id === access.user?.id) return NextResponse.json({ error: 'No podés desactivar tu propia cuenta' }, { status: 400 });
  const member = await prisma.user.findFirst({ where: { id, motelId: access.user?.motelId, role: 'MOTEL_ADMIN' }, select: { id: true } });
  if (!member) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
  const updated = await prisma.user.update({ where: { id }, data: { isActive: body.isActive }, select: { id: true, isActive: true } });
  await logAuditEvent({ userId: access.user?.id, action: 'UPDATE', entityType: 'MotelTeamMember', entityId: id, module: 'motels', metadata: { isActive: updated.isActive, motelId: access.user?.motelId } });
  return NextResponse.json(updated);
}
