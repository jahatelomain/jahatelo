import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scheduleNotification, sendPromoNotificationToFavorites, processScheduledNotificationById } from '@/lib/push-notifications';
import { sanitizeObject } from '@/lib/sanitize';
import { requireAdminAccess } from '@/lib/adminAccess';

const NotificationScheduleSchema = z.object({
  title: z.string().min(1).max(65),
  body: z.string().min(1).max(240),
  scheduledFor: z.string().datetime().optional().nullable(),
  sendNow: z.boolean().optional().default(false),
  type: z.enum(['promo', 'reminder', 'announcement']),
  targetMotelId: z.string().max(100).optional().nullable(),
  targetRole: z.enum(['SUPERADMIN', 'MOTEL_ADMIN', 'USER']).optional().nullable(),
  targetUserIds: z.array(z.string().min(1).max(100)).optional().nullable(),
  relatedEntityId: z.string().max(100).optional().nullable(),
  category: z.enum(['advertising', 'security', 'maintenance']).optional().nullable(),
  data: z.record(z.string(), z.any()).optional().nullable(),
});

const NotificationScheduleQuerySchema = z.object({
  sent: z.enum(['true', 'false', 'all']).optional().default('all'),
  type: z.string().max(50).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

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
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'notifications');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const parsed = NotificationScheduleSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de notificación inválidos' },
        { status: 400 }
      );
    }
    const {
      title,
      body: notificationBody,
      scheduledFor,
      sendNow,
      type,
      targetMotelId,
      targetRole,
      targetUserIds,
      relatedEntityId,
      category,
      data: notificationData,
    } = parsed.data;

    if (!sendNow && !scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor es requerido si sendNow es false' },
        { status: 400 }
      );
    }

    if (!sendNow && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const minutes = scheduledDate.getMinutes();
      if (minutes !== 0 && minutes !== 30) {
        return NextResponse.json(
          { error: 'Solo se permiten horarios en punto y media hora' },
          { status: 400 }
        );
      }
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
    if (!sendNow && !scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor es requerido si sendNow es false' },
        { status: 400 }
      );
    }

    const scheduledDate = sendNow ? new Date() : new Date(scheduledFor ?? '');

    const result = await scheduleNotification({
      title,
      body: notificationBody,
      scheduledFor: scheduledDate,
      type,
      category: category ?? undefined,
      targetUserIds: targetUserIds ?? undefined,
      targetRole: targetRole ?? undefined,
      targetMotelId: targetMotelId ?? undefined,
      relatedEntityId: relatedEntityId ?? undefined,
      notificationData: notificationData ?? undefined,
    });

    if (sendNow) {
      const sendResult = await processScheduledNotificationById(result.id);
      if (!sendResult) {
        return NextResponse.json(
          { error: 'No se pudo procesar la notificación' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          id: result.id,
          sent: sendResult.sent,
          failed: sendResult.failed,
          skipped: sendResult.skipped,
          message: `Notificación enviada: ${sendResult.sent} éxitos, ${sendResult.failed} fallos`,
        },
        { status: 201 }
      );
    }

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
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'notifications');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const parsed = NotificationScheduleQuerySchema.safeParse({
      sent: searchParams.get('sent') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const { sent: sentFilter, type, limit } = parsed.data;

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

    // Log para debugging
    console.log('📨 Listando notificaciones. Total encontradas:', notifications.length);
    if (notifications.length > 0) {
      const sampleIds = notifications.slice(0, 3).map(n => ({ id: n.id, title: n.title }));
      console.log('📋 Muestra de IDs:', sampleIds);
    }

    // Verificar si hay notificaciones sin ID (no debería pasar)
    const withoutId = notifications.filter(n => !n.id);
    if (withoutId.length > 0) {
      console.error('⚠️ ALERTA: Se encontraron', withoutId.length, 'notificaciones sin ID válido');
    }

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
