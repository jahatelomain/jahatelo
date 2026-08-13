import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { hashPassword, generateRandomPassword } from '@/lib/password';
import { ADMIN_MODULES, hasModuleAccess, AdminModule } from '@/lib/adminModules';
import { logAuditEvent } from '@/lib/audit';
import { AdminPaginationSchema, AdminUserCreateSchema, AdminUserQuerySchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';
import { normalizeRelaxedSearch } from '@/lib/search/relaxedSearch';

/**
 * GET /api/admin/users
 * Lista todos los usuarios (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'users');
    if (access.error) return access.error;

    const searchParams = request.nextUrl.searchParams;
    const queryResult = AdminUserQuerySchema.safeParse({
      role: searchParams.get('role') || undefined,
      module: searchParams.get('module') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { role: roleFilter, module: moduleFilter, search: searchFilter, status: statusFilter } = queryResult.data;

    if (moduleFilter && !ADMIN_MODULES.includes(moduleFilter as AdminModule)) {
      return NextResponse.json(
        { error: 'Módulo inválido' },
        { status: 400 }
      );
    }

    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: paginationResult.error.issues }, { status: 400 });
    }
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
        modulePermissions: true,
        accessProfile: { select: { id: true, key: true, name: true, baseRole: true, isActive: true } },
        createdAt: true,
        updatedAt: true,
        motel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    let filteredUsers = users;

    if (roleFilter) {
      filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
    }

    if (moduleFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        hasModuleAccess(
          { role: user.role, modulePermissions: user.modulePermissions },
          moduleFilter as AdminModule
        )
      );
    }

    if (searchFilter) {
      const query = normalizeRelaxedSearch(searchFilter);
      if (query) {
        filteredUsers = filteredUsers.filter((user) => {
          const name = normalizeRelaxedSearch(user.name);
          const email = normalizeRelaxedSearch(user.email);
          return name.includes(query) || email.includes(query);
        });
      }
    }

    const activeCount = filteredUsers.filter((user) => user.isActive).length;
    const inactiveCount = filteredUsers.length - activeCount;
    const roleCounts = filteredUsers.reduce<Record<string, number>>((acc, user) => {
      acc[user.role] = (acc[user.role] ?? 0) + 1;
      return acc;
    }, {});

    if (statusFilter) {
      const shouldBeActive = statusFilter === 'ACTIVE';
      filteredUsers = filteredUsers.filter((user) => user.isActive === shouldBeActive);
    }

    if (!usePagination) {
      return NextResponse.json(filteredUsers);
    }

    const total = filteredUsers.length;
    const start = (page - 1) * limit;
    const paged = filteredUsers.slice(start, start + limit);

    return NextResponse.json({
      data: paged,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          activeCount,
          inactiveCount,
          roleCounts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Crea un nuevo usuario (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'users');
    if (access.error) return access.error;
    const user = access.user;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdminUserCreateSchema.parse(sanitized);
    const { email, name, role, motelId, password, modulePermissions, accessProfileId } = validated;

    // Si es MOTEL_ADMIN, motelId es requerido
    if (role === 'MOTEL_ADMIN' && !motelId) {
      return NextResponse.json(
        { error: 'Para MOTEL_ADMIN el motelId es requerido' },
        { status: 400 }
      );
    }

    if (modulePermissions) {
      const invalidModule = modulePermissions.find((module: string) => !ADMIN_MODULES.includes(module as never));
      if (invalidModule) {
        return NextResponse.json(
          { error: 'Permisos inválidos' },
          { status: 400 }
        );
      }
    }

    const defaultProfileKey = role === 'SUPERADMIN' ? 'superadmin' : role === 'MOTEL_ADMIN' ? 'motel_admin' : 'user';
    const accessProfile = await prisma.accessProfile.findFirst({
      where: accessProfileId ? { id: accessProfileId, isActive: true } : { key: defaultProfileKey, isActive: true },
    });
    if (!accessProfile) {
      return NextResponse.json({ error: 'No se encontró un perfil activo compatible para el usuario' }, { status: 400 });
    }
    if (accessProfileId && !accessProfile) {
      return NextResponse.json({ error: 'El perfil seleccionado no existe o está inactivo' }, { status: 400 });
    }
    if (accessProfile && accessProfile.baseRole !== role) {
      return NextResponse.json({ error: 'El perfil no es compatible con el rol seleccionado' }, { status: 400 });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Si se provee motelId, verificar que el motel existe
    if (motelId) {
      const motel = await prisma.motel.findUnique({
        where: { id: motelId },
      });

      if (!motel) {
        return NextResponse.json(
          { error: 'El motel no existe' },
          { status: 400 }
        );
      }
    }

    // Generar contraseña temporal o usar la proporcionada
    const tempPassword = password || generateRandomPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        motelId: role === 'MOTEL_ADMIN' ? motelId : null,
        modulePermissions: modulePermissions ?? [],
        accessProfileId: accessProfile.id,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
        modulePermissions: true,
        accessProfile: { select: { id: true, key: true, name: true, baseRole: true, isActive: true } },
        createdAt: true,
        motel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    await logAuditEvent({
      userId: user?.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id,
      module: 'users',
      metadata: { email: newUser.email, role: newUser.role, accessProfileId: newUser.accessProfile?.id ?? null },
    });

    return NextResponse.json({
      user: newUser,
      temporaryPassword: tempPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
