import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';
import { hasModuleAccess, AdminModule } from '@/lib/adminModules';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

type RequiredPermissionAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

function actionRequiredByMethod(method: string): RequiredPermissionAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PATCH':
    case 'PUT':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'VIEW';
  }
}

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
    select: {
      role: true,
      modulePermissions: true,
      motelId: true,
      accessProfile: {
        select: {
          id: true,
          isActive: true,
          permissions: { select: { module: true, actions: true } },
        },
      },
    },
  });

  // Un perfil activo es la fuente de permisos preferida. El arreglo legacy se
  // conserva como fallback mientras se migran usuarios existentes.
  const profileModules = dbUser?.accessProfile?.isActive
    ? dbUser.accessProfile.permissions
      .filter((permission) => permission.actions.includes('VIEW'))
      .map((permission) => permission.module)
    : null;

  const effectiveUser = {
    ...user,
    role: dbUser?.role || user.role,
    motelId: dbUser?.motelId || user.motelId,
    modulePermissions: profileModules ?? dbUser?.modulePermissions ?? user.modulePermissions ?? [],
  };

  const auditAccess = async (statusCode: number) => {
    const url = new URL(request.url);
    await logAuditEvent({
      userId: effectiveUser.id,
      action: statusCode === 200 ? 'ACCESS' : 'ACCESS_DENIED',
      entityType: 'AdminRoute',
      entityId: null,
      module,
      method: request.method,
      path: url.pathname,
      statusCode,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });
  };

  if (!hasRole(effectiveUser, roles)) {
    await auditAccess(403);
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  const activeProfile = dbUser?.accessProfile?.isActive ? dbUser.accessProfile : null;
  const requiredAction = actionRequiredByMethod(request.method);
  const modulePermission = activeProfile?.permissions.find((permission) => permission.module === module);
  const profileAllowsAction = modulePermission?.actions.includes(requiredAction)
    || modulePermission?.actions.includes('MANAGE');

  // Los perfiles nuevos controlan tanto módulo como operación. Las cuentas que
  // aún no tengan perfil conservan exactamente el comportamiento legacy.
  if (activeProfile ? !profileAllowsAction : !hasModuleAccess(effectiveUser, module)) {
    await auditAccess(403);
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  await auditAccess(200);

  return { user: effectiveUser };
}
