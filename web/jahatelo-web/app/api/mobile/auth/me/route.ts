import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { MobileProfileUpdateSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/auth/me
 *
 * Obtiene el perfil del usuario autenticado
 * Header: Authorization: Bearer <token>
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        notificationPreferences: true,
        _count: {
          select: {
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

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
        stats: {
          favoritesCount: user._count.favorites,
          reviewsCount: user._count.reviews,
        },
        notificationPreferences: user.notificationPreferences,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/auth/me:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mobile/auth/me
 *
 * Actualiza el perfil del usuario
 * Body: { name?, phone?, profilePhoto?, pushToken?, deviceInfo? }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = MobileProfileUpdateSchema.parse(sanitized);
    const { name, phone, profilePhoto, pushToken, deviceInfo } = validated;

    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: {
        ...(name !== undefined && { name: name?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(profilePhoto !== undefined && { profilePhoto }),
        ...(pushToken !== undefined && { pushToken }),
        ...(deviceInfo !== undefined && { deviceInfo }),
      },
      include: {
        notificationPreferences: true,
      },
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
        updatedAt: user.updatedAt,
        notificationPreferences: user.notificationPreferences,
      },
    });

  } catch (error) {
    console.error('Error in PATCH /api/mobile/auth/me:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
