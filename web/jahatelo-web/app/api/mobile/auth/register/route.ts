import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const MobileRegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  provider: z.enum(['email', 'google', 'facebook', 'apple']).optional().default('email'),
  providerId: z.string().max(255).optional().nullable(),
});

/**
 * POST /api/mobile/auth/register
 *
 * Registro de nuevos usuarios móviles
 * Body: { email, password, name?, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = MobileRegisterSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de registro inválidos' },
        { status: 400 }
      );
    }
    const { email, password, name, phone, provider, providerId } = parsed.data;

    // Para registro con email, password es requerido
    if (provider === 'email' && !password) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const emailNormalized = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
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
        email: emailNormalized,
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
