import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/notifications/preferences
 *
 * Obtiene las preferencias de notificaciones del usuario
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

    // Buscar preferencias
    let preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId: payload.id },
    });

    // Si no existen, crearlas con valores por defecto
    if (!preferences) {
      preferences = await prisma.userNotificationPreferences.create({
        data: {
          userId: payload.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Error al obtener preferencias' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mobile/notifications/preferences
 *
 * Actualiza las preferencias de notificaciones
 * Body: { enableNotifications?, enableEmail?, enablePush?, etc. }
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
    const {
      enableNotifications,
      enableEmail,
      enablePush,
      notifyNewPromos,
      notifyPriceDrops,
      notifyUpdates,
      notifyReviewReplies,
      notifyReviewLikes,
      notifyPromotions,
      notifyNewMotels,
    } = body;

    // Actualizar preferencias (upsert por si no existen)
    const preferences = await prisma.userNotificationPreferences.upsert({
      where: { userId: payload.id },
      create: {
        userId: payload.id,
        enableNotifications: enableNotifications ?? true,
        enableEmail: enableEmail ?? true,
        enablePush: enablePush ?? true,
        notifyNewPromos: notifyNewPromos ?? true,
        notifyPriceDrops: notifyPriceDrops ?? true,
        notifyUpdates: notifyUpdates ?? true,
        notifyReviewReplies: notifyReviewReplies ?? true,
        notifyReviewLikes: notifyReviewLikes ?? false,
        notifyPromotions: notifyPromotions ?? true,
        notifyNewMotels: notifyNewMotels ?? false,
      },
      update: {
        ...(enableNotifications !== undefined && { enableNotifications }),
        ...(enableEmail !== undefined && { enableEmail }),
        ...(enablePush !== undefined && { enablePush }),
        ...(notifyNewPromos !== undefined && { notifyNewPromos }),
        ...(notifyPriceDrops !== undefined && { notifyPriceDrops }),
        ...(notifyUpdates !== undefined && { notifyUpdates }),
        ...(notifyReviewReplies !== undefined && { notifyReviewReplies }),
        ...(notifyReviewLikes !== undefined && { notifyReviewLikes }),
        ...(notifyPromotions !== undefined && { notifyPromotions }),
        ...(notifyNewMotels !== undefined && { notifyNewMotels }),
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferencias actualizadas',
    });

  } catch (error) {
    console.error('Error in PATCH /api/mobile/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias' },
      { status: 500 }
    );
  }
}
