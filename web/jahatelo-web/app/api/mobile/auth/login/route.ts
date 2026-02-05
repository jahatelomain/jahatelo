import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mobile/auth/login
 *
 * Login de usuarios
 * Body: { email, password } o { provider, providerId, email, name }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { provider, providerId, name, pushToken, deviceInfo } = sanitized;

    // Login con email/password
    if (!provider || provider === 'email') {
      // Validar con Zod
      const validated = LoginSchema.parse(sanitized);
      const { email, password } = validated;

      const emailLower = email.toLowerCase().trim();

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: {
          notificationPreferences: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      // Verificar que tenga password (no sea OAuth)
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: 'Esta cuenta usa login social. Por favor usa Google/Apple' },
          { status: 401 }
        );
      }

      // Verificar password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      // Verificar que la cuenta esté activa
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Esta cuenta ha sido desactivada' },
          { status: 403 }
        );
      }

      if (user.provider === 'email' && !user.isEmailVerified) {
        return NextResponse.json(
          { error: 'Email no verificado', needsVerification: true },
          { status: 403 }
        );
      }

      // Actualizar pushToken y deviceInfo si se proveen
      if (pushToken || deviceInfo) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pushToken: pushToken || user.pushToken,
            deviceInfo: deviceInfo || user.deviceInfo,
          },
        });
      }

      // Generar token JWT
      const token = await createToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || undefined,
        motelId: user.motelId || undefined,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          provider: user.provider,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          notificationPreferences: user.notificationPreferences,
        },
        token,
      });
    }

    // Login con OAuth (Google, Apple)
    if (provider && providerId) {
      // Validación básica para OAuth
      const email = sanitized.email;
      if (!email || email.trim().length === 0) {
        return NextResponse.json(
          { error: 'El email es requerido' },
          { status: 400 }
        );
      }

      const emailLower = email.toLowerCase().trim();

      let user = await prisma.user.findFirst({
        where: {
          provider,
          providerId,
        },
        include: {
          notificationPreferences: true,
        },
      });

      // Si no existe, crear cuenta nueva (auto-registro)
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: emailLower,
            name: name?.trim() || null,
            provider,
            providerId,
            role: 'USER',
            isEmailVerified: true, // OAuth users son verificados
            isActive: true,
            pushToken: pushToken || null,
            deviceInfo: deviceInfo || null,
          },
          include: {
            notificationPreferences: true,
          },
        });

        // Crear preferencias de notificaciones
        if (!user.notificationPreferences) {
          await prisma.userNotificationPreferences.create({
            data: {
              userId: user.id,
            },
          });
        }
      } else {
        // Actualizar pushToken y deviceInfo
        if (pushToken || deviceInfo) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              pushToken: pushToken || user.pushToken,
              deviceInfo: deviceInfo || user.deviceInfo,
            },
          });
        }
      }

      // Verificar que la cuenta esté activa
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Esta cuenta ha sido desactivada' },
          { status: 403 }
        );
      }

      // Generar token JWT
      const token = await createToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || undefined,
        motelId: user.motelId || undefined,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          provider: user.provider,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          notificationPreferences: user.notificationPreferences,
        },
        token,
      });
    }

    return NextResponse.json(
      { error: 'Método de autenticación inválido' },
      { status: 400 }
    );

  } catch (error) {
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/mobile/auth/login:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
