import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { hashPassword, generateRandomPassword } from '@/lib/password';
import { logAuditEvent } from '@/lib/audit';

const CreateTeamMemberSchema = z.object({ email: z.string().email(), name: z.string().trim().min(2).max(100), password: z.string().min(8).max(100).optional() });

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  if (!access.user?.motelId) return NextResponse.json({ error: 'Motel no asignado' }, { status: 403 });
  const members = await prisma.user.findMany({ where: { motelId: access.user.motelId, role: 'MOTEL_ADMIN' }, select: { id: true, name: true, email: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const access = await requireAdminAccess(request, ['MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  if (!access.user?.motelId) return NextResponse.json({ error: 'Motel no asignado' }, { status: 403 });
  const parsed = CreateTeamMemberSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
  const temporaryPassword = parsed.data.password ?? generateRandomPassword();
  const profile = await prisma.accessProfile.findFirst({ where: { key: 'motel_admin', isActive: true }, select: { id: true } });
  const member = await prisma.user.create({ data: { email, name: parsed.data.name, passwordHash: await hashPassword(temporaryPassword), role: 'MOTEL_ADMIN', motelId: access.user.motelId, accessProfileId: profile?.id ?? null, isActive: true }, select: { id: true, name: true, email: true, isActive: true } });
  await logAuditEvent({ userId: access.user.id, action: 'CREATE', entityType: 'MotelTeamMember', entityId: member.id, module: 'motels', metadata: { motelId: access.user.motelId, email } });
  return NextResponse.json({ member, temporaryPassword }, { status: 201 });
}
