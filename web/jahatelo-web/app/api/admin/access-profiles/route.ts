import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { ADMIN_MODULES } from '@/lib/adminModules';
import { logAuditEvent } from '@/lib/audit';

const ProfileSchema = z.object({
  key: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,50}$/),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(300).nullable().optional(),
  baseRole: z.enum(['SUPERADMIN', 'MOTEL_ADMIN', 'USER']),
  permissions: z.array(z.object({ module: z.enum(ADMIN_MODULES), actions: z.array(z.enum(['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'MANAGE'])).min(1) })).default([]),
});

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
  if (access.error) return access.error;
  return NextResponse.json(await prisma.accessProfile.findMany({ include: { permissions: { orderBy: { module: 'asc' } }, _count: { select: { users: true } } }, orderBy: [{ isSystem: 'desc' }, { name: 'asc' }] }));
}

export async function POST(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
  if (access.error) return access.error;
  const parsed = ProfileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Perfil inválido', details: parsed.error.issues }, { status: 400 });
  const profile = await prisma.accessProfile.create({ data: { ...parsed.data, permissions: { create: parsed.data.permissions } }, include: { permissions: true } });
  await logAuditEvent({ userId: access.user?.id, action: 'CREATE', entityType: 'AccessProfile', entityId: profile.id, module: 'configuracion', metadata: { key: profile.key, name: profile.name } });
  return NextResponse.json(profile, { status: 201 });
}
