import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';
import { GoogleAuthError, verifyGoogleIdToken } from '@/lib/googleAuth';

interface GoogleCallbackBody {
  provider: 'google';
  idToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GoogleCallbackBody = await request.json();
    if (body.provider !== 'google') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const { providerId, email, name } = await verifyGoogleIdToken(body.idToken, 'web');

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario existente por provider+providerId o por email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { provider: 'google', providerId },
          { email: normalizedEmail },
        ],
      },
    });

    if (!user) {
      // Registrar nuevo usuario OAuth
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          provider: 'google',
          providerId,
          isEmailVerified: true,
          isActive: true,
          role: 'USER',
        },
      });
    } else {
      if (!user.isActive) {
        return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
      }
      if (user.provider === 'google' && user.providerId && user.providerId !== providerId) {
        return NextResponse.json({ error: 'Cuenta Google ya vinculada' }, { status: 409 });
      }
      // Vincular cuenta existente (email match) con Google si aún no está vinculada
      if (!user.providerId || user.provider !== 'google') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId,
            isEmailVerified: true,
          },
        });
      }

      // Verificar que la cuenta esté activa
      if (!user.isActive) {
        return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
      }
    }

    // Crear JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role as 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER',
      motelId: user.motelId || undefined,
      name: user.name || undefined,
      modulePermissions: (user.modulePermissions as string[]) ?? [],
    });

    // Setear cookie httpOnly (igual que /api/auth/login)
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        motelId: user.motelId,
        modulePermissions: (user.modulePermissions as string[]) ?? [],
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    logger.error({
      message: 'Google OAuth callback error',
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al procesar autenticación con Google' }, { status: 500 });
  }
}
