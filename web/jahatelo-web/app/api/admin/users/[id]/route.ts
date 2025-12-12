import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';
import { hashPassword, generateRandomPassword } from '@/lib/password';

/**
 * PATCH /api/admin/users/:id
 * Actualiza un usuario (solo SUPERADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, motelId, isActive, resetPassword } = body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
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

    let temporaryPassword: string | undefined;

    // Si se solicita reset de password
    if (resetPassword === true) {
      temporaryPassword = generateRandomPassword();
      updateData.passwordHash = await hashPassword(temporaryPassword);
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
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
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
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
      where: { id },
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
