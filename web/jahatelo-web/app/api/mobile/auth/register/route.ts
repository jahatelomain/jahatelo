import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mobile/auth/register
 *
 * Registro de nuevos usuarios móviles
 * Body: { email, password, name?, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, provider = 'email', providerId } = body;

    // Validaciones básicas
    if (!email || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Para registro con email, password es requerido
    if (provider === 'email' && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash del password (solo para registro con email)
    let passwordHash = null;
    if (provider === 'email' && password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        provider,
        providerId,
        role: 'USER',
        isEmailVerified: provider !== 'email', // OAuth users son verificados automáticamente
        isActive: true,
      },
    });

    // Crear preferencias de notificaciones por defecto
    await prisma.userNotificationPreferences.create({
      data: {
        userId: user.id,
      },
    });

    // Generar token JWT
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        provider: user.provider,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/mobile/auth/register:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
