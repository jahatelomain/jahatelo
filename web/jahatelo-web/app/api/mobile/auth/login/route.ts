import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';
import { GoogleAuthError, verifyGoogleIdToken } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mobile/auth/login
 *
 * Login de usuarios
 * Body: { email, password } o { provider: 'google', idToken }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { provider, pushToken, deviceInfo } = sanitized;

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

      if (user.role === 'USER' && user.provider === 'email' && !user.isEmailVerified) {
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

    // Solo Google tiene un verificador implementado.
    if (provider !== 'google' || typeof body.idToken !== 'string' || !body.idToken) {
      return NextResponse.json({ error: 'Token de Google requerido' }, { status: 401 });
    }

    if (provider === 'google') {
      const { providerId, email, name } = await verifyGoogleIdToken(body.idToken, 'mobile');

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

      // Match the web callback: link a verified Google identity to an existing email.
      if (!user) {
        user = await prisma.user.findUnique({
          where: { email: emailLower },
          include: { notificationPreferences: true },
        });
      }

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
        if (!user.isActive) {
          return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
        }
        if (user.provider === 'google' && user.providerId && user.providerId !== providerId) {
          return NextResponse.json({ error: 'Cuenta Google ya vinculada' }, { status: 409 });
        }
        if (!user.providerId || user.provider !== 'google') {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { provider: 'google', providerId, isEmailVerified: true },
            include: { notificationPreferences: true },
          });
        }
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
    if (error instanceof GoogleAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
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
