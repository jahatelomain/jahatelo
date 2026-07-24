import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { ADMIN_MODULES } from '@/lib/adminModules';
import { logAuditEvent } from '@/lib/audit';

const UpdateSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.object({ module: z.enum(ADMIN_MODULES), actions: z.array(z.enum(['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'MANAGE'])).min(1) })).min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
  if (access.error) return access.error;
  const parsed = UpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Perfil inválido', details: parsed.error.issues }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.accessProfile.findUnique({ where: { id }, include: { permissions: true } });
  if (!existing) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  const { permissions, ...data } = parsed.data;
  const profile = await prisma.accessProfile.update({ where: { id }, data: { ...data, ...(permissions ? { permissions: { deleteMany: {}, create: permissions } } : {}) }, include: { permissions: true } });
  await logAuditEvent({ userId: access.user?.id, action: 'UPDATE', entityType: 'AccessProfile', entityId: id, module: 'configuracion', before: { name: existing.name, isActive: existing.isActive }, after: { name: profile.name, isActive: profile.isActive } });
  return NextResponse.json(profile);
}
