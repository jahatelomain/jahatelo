import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';
import { hashPassword, generateRandomPassword } from '@/lib/password';

/**
 * GET /api/admin/users
 * Lista todos los usuarios (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        motelId: true,
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

    return NextResponse.json(users);
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
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role, motelId, password } = body;

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
