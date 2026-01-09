import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';
import { hasModuleAccess, AdminModule } from '@/lib/adminModules';
import { prisma } from '@/lib/prisma';

export async function requireAdminAccess(
  request: Request,
  roles: Array<'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER'>,
  module: AdminModule
) {
  const token = await getTokenFromRequest(request as never);
  if (!token) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }

  const user = await verifyToken(token);
  if (!user) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, modulePermissions: true, motelId: true },
  });

  const effectiveUser = {
    ...user,
    role: dbUser?.role || user.role,
    motelId: dbUser?.motelId || user.motelId,
    modulePermissions: dbUser?.modulePermissions ?? user.modulePermissions ?? [],
  };

  if (!hasRole(effectiveUser, roles)) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  if (!hasModuleAccess(effectiveUser, module)) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  return { user: effectiveUser };
}
