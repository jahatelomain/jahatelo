import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { hashPassword, generateRandomPassword } from '@/lib/password';
import { ADMIN_MODULES } from '@/lib/adminModules';
import { logAuditEvent } from '@/lib/audit';
import { AdminUserUpdateSchema, IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * PATCH /api/admin/users/:id
 * Actualiza un usuario (solo SUPERADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'users');
    if (access.error) return access.error;
    const user = access.user;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdminUserUpdateSchema.parse(sanitized);
    const { name, role, motelId, isActive, resetPassword, modulePermissions, accessProfileId } = validated;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: idResult.data },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: {
      name?: string;
      role?: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
      motelId?: string | null;
      isActive?: boolean;
      passwordHash?: string;
      modulePermissions?: string[];
      accessProfileId?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Si cambia el rol
    if (role !== undefined) {
      if (!['SUPERADMIN', 'MOTEL_ADMIN', 'USER'].includes(role)) {
        return NextResponse.json(
          { error: 'Rol inválido' },
          { status: 400 }
        );
      }
      updateData.role = role;

      // Si el nuevo rol es MOTEL_ADMIN, motelId es requerido
      if (role === 'MOTEL_ADMIN' && !motelId && !existingUser.motelId) {
        return NextResponse.json(
          { error: 'Para MOTEL_ADMIN el motelId es requerido' },
          { status: 400 }
        );
      }

      // Si el rol no es MOTEL_ADMIN, limpiar motelId
      if (role !== 'MOTEL_ADMIN') {
        updateData.motelId = null;
      }
    }

    // Si se actualiza motelId
    if (motelId !== undefined) {
      if (motelId) {
        // Verificar que el motel existe
        const motel = await prisma.motel.findUnique({
          where: { id: motelId },
        });

        if (!motel) {
          return NextResponse.json(
            { error: 'El motel no existe' },
            { status: 400 }
          );
        }

        updateData.motelId = motelId;
      } else {
        updateData.motelId = null;
      }
    }

    if (modulePermissions !== undefined) {
      if (!Array.isArray(modulePermissions)) {
        return NextResponse.json(
          { error: 'Permisos inválidos' },
          { status: 400 }
        );
      }
      const invalidModule = modulePermissions.find((module: string) => !ADMIN_MODULES.includes(module as never));
      if (invalidModule) {
        return NextResponse.json(
          { error: 'Permisos inválidos' },
          { status: 400 }
        );
      }
      updateData.modulePermissions = modulePermissions;
    }

    if (accessProfileId !== undefined) {
      if (!accessProfileId) {
        updateData.accessProfileId = null;
      } else {
        const accessProfile = await prisma.accessProfile.findFirst({ where: { id: accessProfileId, isActive: true } });
        if (!accessProfile) {
          return NextResponse.json({ error: 'El perfil seleccionado no existe o está inactivo' }, { status: 400 });
        }
        const targetRole = role ?? existingUser.role;
        if (accessProfile.baseRole !== targetRole) {
          return NextResponse.json({ error: 'El perfil no es compatible con el rol seleccionado' }, { status: 400 });
        }
        updateData.accessProfileId = accessProfile.id;
      }
    } else if (role !== undefined && role !== existingUser.role) {
      const defaultProfileKey = role === 'SUPERADMIN' ? 'superadmin' : role === 'MOTEL_ADMIN' ? 'motel_admin' : 'user';
      const defaultProfile = await prisma.accessProfile.findFirst({ where: { key: defaultProfileKey, isActive: true } });
      if (!defaultProfile) {
        return NextResponse.json({ error: 'No se encontró un perfil activo compatible para el rol seleccionado' }, { status: 400 });
      }
      updateData.accessProfileId = defaultProfile.id;
    }

    let temporaryPassword: string | undefined;

    // Si se solicita reset de password
    if (resetPassword === true) {
      temporaryPassword = generateRandomPassword();
      updateData.passwordHash = await hashPassword(temporaryPassword);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: idResult.data },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
        modulePermissions: true,
        accessProfile: { select: { id: true, key: true, name: true, baseRole: true, isActive: true } },
        updatedAt: true,
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
      action: 'UPDATE',
      entityType: 'User',
      entityId: updatedUser.id,
      module: 'users',
      metadata: { role: updatedUser.role, isActive: updatedUser.isActive, accessProfileId: updatedUser.accessProfile?.id ?? null },
    });

    const response: {
      user: typeof updatedUser;
      temporaryPassword?: string;
    } = { user: updatedUser };

    if (temporaryPassword) {
      response.temporaryPassword = temporaryPassword;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * Elimina un usuario (solo SUPERADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'users');
    if (access.error) return access.error;
    const user = access.user;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: idResult.data },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar al propio usuario
    if (existingUser.id === user?.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      );
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: user?.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: idResult.data,
      metadata: { email: existingUser.email },
    });

    return NextResponse.json(
      { message: 'Usuario eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
