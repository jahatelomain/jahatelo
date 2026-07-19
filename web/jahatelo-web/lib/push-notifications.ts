import { Prisma, UserRole } from '@prisma/client';
import { prisma } from './prisma';

type NotificationData = Prisma.InputJsonObject;

type ExpoPushResponseEntry = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

function getExpoPushResponseEntry(value: unknown): ExpoPushResponseEntry | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const data = (value as { data?: unknown }).data;
  const entry = Array.isArray(data) ? data[0] : data;
  return typeof entry === 'object' && entry !== null ? entry as ExpoPushResponseEntry : undefined;
}

function hasIncludeGuests(data: unknown): boolean {
  return typeof data === 'object' && data !== null &&
    (data as { includeGuests?: unknown }).includeGuests === true;
}

function toNotificationData(data: unknown): NotificationData {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
    ? data as NotificationData
    : {};
}

/**
 * Tipo de notificación push
 */
export interface PushNotification {
  title: string;
  body: string;
  data?: NotificationData;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * Resultado del envío de notificación
 */
export interface PushSendResult {
  success: boolean;
  error?: string;
  details?: unknown;
}

/**
 * Envía una notificación push a un token específico
 */
export async function sendPushNotification(
  token: string,
  notification: PushNotification
): Promise<PushSendResult> {
  try {
    // Validar que el token sea válido
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      return {
        success: false,
        error: 'Token inválido',
      };
    }

    // Construir el mensaje para Expo
    const message = {
      to: token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge,
      channelId: notification.channelId || 'default',
      priority: notification.priority || 'high',
    };

    // Enviar a Expo Push Notification Service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result: unknown = await response.json();
    const entry = getExpoPushResponseEntry(result);

    if (response.ok && entry?.status === 'ok') {
      return {
        success: true,
        details: entry,
      };
    }

    // Si hay error, verificar si el token es inválido
    if (entry?.details?.error === 'DeviceNotRegistered') {
      // Desactivar el token en la base de datos
      await prisma.pushToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
    }

    return {
      success: false,
      error: entry?.message || 'Error desconocido',
      details: entry,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar notificación',
    };
  }
}

/**
 * Envía notificaciones push a múltiples tokens
 */
export async function sendPushNotifications(
  tokens: string[],
  notification: PushNotification
): Promise<PushSendResult[]> {
  const results = await Promise.all(
    tokens.map((token) => sendPushNotification(token, notification))
  );

  return results;
}

/**
 * Envía una notificación a todos los usuarios SUPERADMIN activos
 * Respeta las preferencias de notificación de cada usuario
 */
export async function sendNotificationToAdmins(
  notification: PushNotification,
  notificationType?: 'contact_message' | 'prospect' | 'payment_reminder' | 'motel_approval'
): Promise<{ sent: number; failed: number; skipped: number }> {
  try {
    // Buscar todos los usuarios SUPERADMIN
    const admins = await prisma.user.findMany({
      where: {
        role: 'SUPERADMIN',
        isActive: true,
      },
      include: {
        pushTokens: {
          where: {
            isActive: true,
          },
        },
        notificationPreferences: true,
      },
    });

    let skipped = 0;
    const eligibleTokens: string[] = [];

    // Filtrar usuarios según sus preferencias
    for (const admin of admins) {
      // Si no tiene preferencias, crear con valores por defecto
      if (!admin.notificationPreferences) {
        await prisma.userNotificationPreferences.create({
          data: { userId: admin.id },
        });
        // Por defecto todo está habilitado, así que incluir al admin
        eligibleTokens.push(...admin.pushTokens.map((pt) => pt.token));
        continue;
      }

      const prefs = admin.notificationPreferences;

      // Verificar si las notificaciones están habilitadas globalmente
      if (!prefs.enableNotifications || !prefs.enablePush) {
        skipped += admin.pushTokens.length;
        continue;
      }

      // Verificar preferencias específicas según el tipo de notificación
      let shouldSend = true;

      if (notificationType) {
        switch (notificationType) {
          case 'contact_message':
            shouldSend = prefs.notifyContactMessages;
            break;
          case 'prospect':
            shouldSend = prefs.notifyNewProspects;
            break;
          case 'payment_reminder':
            shouldSend = prefs.notifyPaymentReminders;
            break;
          case 'motel_approval':
            shouldSend = prefs.notifyMotelApprovals;
            break;
        }
      }

      if (shouldSend) {
        eligibleTokens.push(...admin.pushTokens.map((pt) => pt.token));
      } else {
        skipped += admin.pushTokens.length;
      }
    }

    if (eligibleTokens.length === 0) {
      return { sent: 0, failed: 0, skipped };
    }

    // Enviar notificaciones
    const results = await sendPushNotifications(eligibleTokens, notification);

    // Contar éxitos y fallos
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return { sent, failed, skipped };
  } catch (error) {
    console.error('Error sending notifications to admins:', error);
    return { sent: 0, failed: 0, skipped: 0 };
  }
}

/**
 * Envía una notificación a un usuario específico
 */
export async function sendNotificationToUser(
  userId: string,
  notification: PushNotification
): Promise<{ sent: number; failed: number }> {
  try {
    // Buscar tokens activos del usuario
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (pushTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const tokens = pushTokens.map((pt) => pt.token);
    const results = await sendPushNotifications(tokens, notification);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return { sent, failed };
  } catch (error) {
    console.error('Error sending notifications to user:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envía notificación sobre un nuevo mensaje de contacto
 */
export async function sendNewContactMessageNotification(
  contactMessage: {
    id: string;
    name: string;
    message: string;
  }
): Promise<void> {
  const notification: PushNotification = {
    title: '📨 Nuevo mensaje de contacto',
    body: `${contactMessage.name}: ${contactMessage.message.substring(0, 100)}${contactMessage.message.length > 100 ? '...' : ''}`,
    data: {
      type: 'contact_message',
      messageId: contactMessage.id,
      screen: 'Inbox',
    },
    sound: 'default',
    badge: 1,
    priority: 'high',
  };

  const result = await sendNotificationToAdmins(notification, 'contact_message');
  console.log(
    `Notificación de contacto enviada: ${result.sent} éxitos, ${result.failed} fallos, ${result.skipped} omitidos`
  );
}

/**
 * Envía notificación de promo a usuarios que favoritearon un motel
 */
export async function sendPromoNotificationToFavorites(
  motelId: string,
  promo: {
    id: string;
    title: string;
    description?: string | null;
  }
): Promise<{ sent: number; failed: number }> {
  try {
    // Buscar usuarios que favoritearon este motel
    const favorites = await prisma.favorite.findMany({
      where: {
        motelId,
      },
      include: {
        user: {
          include: {
            pushTokens: {
              where: {
                isActive: true,
              },
            },
            notificationPreferences: true,
          },
        },
      },
    });

    if (favorites.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Buscar información del motel
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { name: true, slug: true },
    });

    if (!motel) {
      return { sent: 0, failed: 0 };
    }

    const notification: PushNotification = {
      title: `🎉 Nueva promo en ${motel.name}`,
      body: promo.title + (promo.description ? ` - ${promo.description.substring(0, 80)}` : ''),
      data: {
        type: 'promo',
        promoId: promo.id,
        motelId,
        motelSlug: motel.slug,
      },
      sound: 'default',
      priority: 'default',
    };

    const eligibleTokens: string[] = [];

    // Filtrar usuarios según preferencias
    for (const fav of favorites) {
      const user = fav.user;

      // Verificar preferencias de notificación
      if (user.notificationPreferences) {
        const prefs = user.notificationPreferences;
        if (!prefs.enableNotifications || !prefs.enablePush || !prefs.notifyNewPromos) {
          continue;
        }
      }

      // Agregar tokens del usuario
      eligibleTokens.push(...user.pushTokens.map((pt) => pt.token));
    }

    if (eligibleTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Enviar notificaciones
    const results = await sendPushNotifications(eligibleTokens, notification);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return { sent, failed };
  } catch (error) {
    console.error('Error sending promo notification:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Programa una notificación para ser enviada en el futuro
 */
export async function scheduleNotification(data: {
  title: string;
  body: string;
  scheduledFor: Date;
  type: string;
  category?: string;
  targetUserIds?: string[];
  targetRole?: string;
  targetMotelId?: string;
  relatedEntityId?: string;
  notificationData?: NotificationData;
}): Promise<{ id: string }> {
  try {
    const scheduledNotification = await prisma.scheduledNotification.create({
      data: {
        title: data.title,
        body: data.body,
        scheduledFor: data.scheduledFor,
        type: data.type,
        category: data.category || 'advertising',
        targetUserIds: data.targetUserIds || [],
        targetRole: data.targetRole,
        targetMotelId: data.targetMotelId,
        relatedEntityId: data.relatedEntityId,
        data: data.notificationData ?? {},
      },
    });

    return { id: scheduledNotification.id };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Verifica si se debe enviar notificación a un usuario según la categoría
 * @param user Usuario con preferencias de notificación
 * @param category Categoría de la notificación (advertising, security, maintenance)
 * @returns true si se debe enviar, false si se debe omitir
 */
function shouldSendNotificationByCategory(
  user: {
    notificationPreferences?: {
      enableAdvertisingPush: boolean;
      enableSecurityPush: boolean;
      enableMaintenancePush: boolean;
      enableNotifications: boolean;
      enablePush: boolean;
    } | null;
  },
  category: string
): boolean {
  // Si no tiene preferencias, enviar por defecto
  if (!user.notificationPreferences) {
    return true;
  }

  const prefs = user.notificationPreferences;

  // Si las notificaciones están deshabilitadas globalmente, no enviar
  if (!prefs.enableNotifications || !prefs.enablePush) {
    return false;
  }

  // Verificar por categoría
  switch (category) {
    case 'advertising':
      // Publicidad: respetar preferencia del usuario
      return prefs.enableAdvertisingPush;

    case 'security':
      // Seguridad: siempre enviar (crítico)
      return true;

    case 'maintenance':
      // Mantenimiento: siempre enviar (importante)
      return true;

    default:
      // Por defecto, respetar preferencia de publicidad
      return prefs.enableAdvertisingPush;
  }
}

async function deliverScheduledNotification(notification: {
  id: string;
  title: string;
  body: string;
  data: unknown;
  category: string;
  targetUserIds: string[];
  targetRole: string | null;
  targetMotelId: string | null;
}) {
  const tokens: string[] = [];
  let skipped = 0;
  const category = notification.category || 'advertising';
  const includeGuests = hasIncludeGuests(notification.data);

  if (notification.targetUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: notification.targetUserIds,
        },
        isActive: true,
      },
      include: {
        pushTokens: {
          where: {
            isActive: true,
          },
        },
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      if (shouldSendNotificationByCategory(user, category)) {
        tokens.push(...user.pushTokens.map((pt) => pt.token));
      } else {
        skipped += user.pushTokens.length;
      }
    }
  } else if (notification.targetRole) {
    const users = await prisma.user.findMany({
      where: {
        role: notification.targetRole as UserRole,
        isActive: true,
      },
      include: {
        pushTokens: {
          where: {
            isActive: true,
          },
        },
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      if (shouldSendNotificationByCategory(user, category)) {
        tokens.push(...user.pushTokens.map((pt) => pt.token));
      } else {
        skipped += user.pushTokens.length;
      }
    }
  } else if (notification.targetMotelId) {
    const favorites = await prisma.favorite.findMany({
      where: {
        motelId: notification.targetMotelId,
      },
      include: {
        user: {
          include: {
            pushTokens: {
              where: {
                isActive: true,
              },
            },
            notificationPreferences: true,
          },
        },
      },
    });

    for (const fav of favorites) {
      if (shouldSendNotificationByCategory(fav.user, category)) {
        tokens.push(...fav.user.pushTokens.map((pt) => pt.token));
      } else {
        skipped += fav.user.pushTokens.length;
      }
    }
  } else {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        pushTokens: {
          where: {
            isActive: true,
          },
        },
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      if (shouldSendNotificationByCategory(user, category)) {
        tokens.push(...user.pushTokens.map((pt) => pt.token));
      } else {
        skipped += user.pushTokens.length;
      }
    }

    if (includeGuests) {
      const guestTokens = await prisma.pushToken.findMany({
        where: {
          userId: null,
          isActive: true,
        },
        select: {
          token: true,
        },
      });
      tokens.push(...guestTokens.map((pt) => pt.token));
    }
  }

  if (tokens.length > 0) {
    const results = await sendPushNotifications(tokens, {
      title: notification.title,
      body: notification.body,
      data: toNotificationData(notification.data),
      sound: 'default',
    });

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await prisma.scheduledNotification.update({
      where: { id: notification.id },
      data: {
        sent: true,
        sentAt: new Date(),
        totalSent: sent,
        totalFailed: failed,
        totalSkipped: skipped,
      },
    });

    return { sent, failed, skipped };
  }

  await prisma.scheduledNotification.update({
    where: { id: notification.id },
    data: {
      sent: true,
      sentAt: new Date(),
      totalSent: 0,
      totalFailed: 0,
      totalSkipped: skipped,
      errorMessage: skipped > 0 ? 'All users opted out of this category' : 'No recipients found',
    },
  });

  return { sent: 0, failed: 0, skipped };
}

export async function processScheduledNotificationById(id: string) {
  const notification = await prisma.scheduledNotification.findUnique({
    where: { id },
  });

  if (!notification) {
    return null;
  }

  if (notification.sent) {
    return {
      sent: notification.totalSent,
      failed: notification.totalFailed,
      skipped: notification.totalSkipped,
    };
  }

  return deliverScheduledNotification(notification);
}

/**
 * Procesa y envía notificaciones programadas que ya llegaron a su fecha
 * Esta función debe ejecutarse periódicamente (ej: cada minuto con un cron job)
 */
export async function processScheduledNotifications(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  try {
    // Buscar notificaciones pendientes que ya pasaron su fecha
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        sent: false,
        scheduledFor: {
          lte: new Date(),
        },
      },
      take: 50, // Procesar máximo 50 por vez
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const notification of pendingNotifications) {
      try {
        const result = await deliverScheduledNotification(notification);
        totalSent += result.sent;
        totalFailed += result.failed;
      } catch (error) {
        console.error(`Error processing scheduled notification ${notification.id}:`, error);
        totalFailed++;

        // Marcar como error
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            sent: true,
            sentAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return {
      processed: pendingNotifications.length,
      sent: totalSent,
      failed: totalFailed,
    };
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return { processed: 0, sent: 0, failed: 0 };
  }
}
