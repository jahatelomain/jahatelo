import { NextRequest, NextResponse } from 'next/server';
import { scheduleNotification, sendPromoNotificationToFavorites } from '@/lib/push-notifications';

/**
 * POST /api/notifications/schedule
 * Programa una notificación para ser enviada en el futuro
 * o la envía inmediatamente si sendNow=true
 *
 * Body: {
 *   title: string,
 *   body: string,
 *   scheduledFor?: Date,  // Opcional si sendNow=true
 *   sendNow?: boolean,     // Si es true, envía inmediatamente
 *   type: "promo" | "reminder" | "announcement",
 *   targetMotelId?: string,  // Para enviar a usuarios que favoritearon un motel
 *   targetRole?: "SUPERADMIN" | "MOTEL_ADMIN" | "USER",
 *   targetUserIds?: string[],  // IDs específicos de usuarios
 *   relatedEntityId?: string,  // ID de la promo, motel, etc.
 *   data?: object  // Datos adicionales para la notificación
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      body: notificationBody,
      scheduledFor,
      sendNow = false,
      type,
      targetMotelId,
      targetRole,
      targetUserIds,
      relatedEntityId,
      data: notificationData,
    } = body;

    // Validaciones
    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: 'title y body son requeridos' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type es requerido' },
        { status: 400 }
      );
    }

    if (!sendNow && !scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor es requerido si sendNow es false' },
        { status: 400 }
      );
    }

    // Si es para enviar ahora y es de tipo promo para un motel
    if (sendNow && type === 'promo' && targetMotelId && relatedEntityId) {
      const result = await sendPromoNotificationToFavorites(targetMotelId, {
        id: relatedEntityId,
        title,
        description: notificationBody,
      });

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        message: `Notificación enviada: ${result.sent} éxitos, ${result.failed} fallos`,
      });
    }

    // Programar para el futuro
    const scheduledDate = sendNow ? new Date() : new Date(scheduledFor);

    const result = await scheduleNotification({
      title,
      body: notificationBody,
      scheduledFor: scheduledDate,
      type,
      targetUserIds,
      targetRole,
      targetMotelId,
      relatedEntityId,
      notificationData,
    });

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        message: sendNow
          ? 'Notificación programada para envío inmediato'
          : `Notificación programada para ${scheduledDate.toISOString()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json(
      { error: 'Error al programar notificación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/schedule
 * Lista notificaciones programadas
 * Query params:
 *   - sent: "true" | "false" | "all" (default: "all")
 *   - type: tipo de notificación (opcional)
 *   - limit: número de resultados (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sentFilter = searchParams.get('sent') || 'all';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (sentFilter !== 'all') {
      where.sent = sentFilter === 'true';
    }

    if (type) {
      where.type = type;
    }

    const { prisma } = await import('@/lib/prisma');

    const notifications = await prisma.scheduledNotification.findMany({
      where,
      orderBy: {
        scheduledFor: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones programadas' },
      { status: 500 }
    );
  }
}
