import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import logger from '@/lib/logger';
import { FacebookAuthError, verifyFacebookAccessToken } from '@/lib/facebookAuth';

interface FacebookCallbackBody {
  provider: 'facebook';
  accessToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FacebookCallbackBody = await request.json();
    if (body.provider !== 'facebook') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { providerId, email, name } = await verifyFacebookAccessToken(body.accessToken);
    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { provider: 'facebook', providerId },
          { email: normalizedEmail },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          provider: 'facebook',
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
      if (user.provider === 'facebook' && user.providerId && user.providerId !== providerId) {
        return NextResponse.json({ error: 'Cuenta Facebook ya vinculada' }, { status: 409 });
      }
      if (!user.providerId || user.provider !== 'facebook') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'facebook',
            providerId,
            isEmailVerified: true,
          },
        });
      }
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role as 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER',
      motelId: user.motelId || undefined,
      name: user.name || undefined,
      modulePermissions: (user.modulePermissions as string[]) ?? [],
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
    if (error instanceof FacebookAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    logger.error({
      message: 'Facebook OAuth callback error',
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al procesar autenticación con Facebook' }, { status: 500 });
  }
}
