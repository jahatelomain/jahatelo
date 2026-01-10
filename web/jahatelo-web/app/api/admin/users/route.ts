import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { hashPassword, generateRandomPassword } from '@/lib/password';
import { ADMIN_MODULES, hasModuleAccess, AdminModule } from '@/lib/adminModules';
import { logAuditEvent } from '@/lib/audit';

/**
 * GET /api/admin/users
 * Lista todos los usuarios (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'users');
    if (access.error) return access.error;

    const searchParams = request.nextUrl.searchParams;
    const roleFilter = searchParams.get('role');
    const moduleFilter = searchParams.get('module');
    const searchFilter = searchParams.get('search');

    if (roleFilter && !['SUPERADMIN', 'MOTEL_ADMIN', 'USER'].includes(roleFilter)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    if (moduleFilter && !ADMIN_MODULES.includes(moduleFilter as AdminModule)) {
      return NextResponse.json(
        { error: 'Módulo inválido' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
        modulePermissions: true,
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
      const query = searchFilter.trim().toLowerCase();
      if (query) {
        filteredUsers = filteredUsers.filter((user) => {
          const name = user.name?.toLowerCase() ?? '';
          const email = user.email?.toLowerCase() ?? '';
          return name.includes(query) || email.includes(query);
        });
      }
    }

    return NextResponse.json(filteredUsers);
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
    const { email, name, role, motelId, password, modulePermissions } = body;

    // Validaciones
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido
    if (!['SUPERADMIN', 'MOTEL_ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Si es MOTEL_ADMIN, motelId es requerido
    if (role === 'MOTEL_ADMIN' && !motelId) {
      return NextResponse.json(
        { error: 'Para MOTEL_ADMIN el motelId es requerido' },
        { status: 400 }
      );
    }

    if (modulePermissions && !Array.isArray(modulePermissions)) {
      return NextResponse.json(
        { error: 'Permisos inválidos' },
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
      metadata: { email: newUser.email, role: newUser.role },
    });

    return NextResponse.json({
      user: newUser,
      temporaryPassword: tempPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
