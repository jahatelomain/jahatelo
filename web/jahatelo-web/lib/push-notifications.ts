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
  notification: PushNotification,
  attempt = 0
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

    const retryable = response.status === 429 || response.status >= 500 ||
      entry?.details?.error === 'MessageRateExceeded';
    if (retryable && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
      return sendPushNotification(token, notification, attempt + 1);
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
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
      return sendPushNotification(token, notification, attempt + 1);
    }
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
  const results: PushSendResult[] = [];
  for (let index = 0; index < tokens.length; index += 100) {
    const chunk = tokens.slice(index, index + 100);
    results.push(...await Promise.all(
      chunk.map((token) => sendPushNotification(token, notification))
    ));
  }
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

export async function sendFavoriteMotelUpdateNotification(motelId: string) {
  const [motel, favorites] = await Promise.all([
    prisma.motel.findUnique({ where: { id: motelId }, select: { name: true, slug: true } }),
    prisma.favorite.findMany({
      where: { motelId },
      include: {
        user: {
          include: {
            pushTokens: { where: { isActive: true } },
            notificationPreferences: true,
          },
        },
      },
    }),
  ]);
  if (!motel) return { sent: 0, failed: 0 };

  const tokens = favorites.flatMap(({ user }) => {
    const prefs = user.notificationPreferences;
    if (prefs && (!prefs.enableNotifications || !prefs.enablePush || !prefs.notifyUpdates)) return [];
    return user.pushTokens.map(({ token }) => token);
  });
  const results = await sendPushNotifications([...new Set(tokens)], {
    title: `${motel.name} actualizó su información`,
    body: 'Revisa las novedades del motel que guardaste en favoritos.',
    data: { type: 'motel_update', motelId, motelSlug: motel.slug },
  });
  return {
    sent: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
  };
}

async function sendReviewActivityNotification(
  reviewId: string,
  actorUserId: string | null,
  kind: 'review_reply' | 'review_like'
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      motelId: true,
      motel: { select: { name: true, slug: true } },
      user: {
        select: {
          notificationPreferences: true,
          pushTokens: { where: { isActive: true } },
        },
      },
    },
  });
  if (!review || !review.user || review.userId === actorUserId) return;
  const prefs = review.user.notificationPreferences;
  const enabled = !prefs || (
    prefs.enableNotifications && prefs.enablePush &&
    (kind === 'review_reply' ? prefs.notifyReviewReplies : prefs.notifyReviewLikes)
  );
  if (!enabled) return;
  await sendPushNotifications(review.user.pushTokens.map(({ token }) => token), {
    title: kind === 'review_reply' ? 'Respondieron tu reseña' : 'A alguien le gustó tu reseña',
    body: review.motel?.name
      ? `Hay actividad nueva en tu reseña de ${review.motel.name}.`
      : 'Hay actividad nueva en una de tus reseñas.',
    data: {
      type: kind,
      reviewId,
      motelId: review.motelId,
      motelSlug: review.motel?.slug,
    },
  });
}

export const sendReviewReplyNotification = (reviewId: string, actorUserId: string) =>
  sendReviewActivityNotification(reviewId, actorUserId, 'review_reply');

export const sendReviewLikeNotification = (reviewId: string, actorUserId: string) =>
  sendReviewActivityNotification(reviewId, actorUserId, 'review_like');

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
      notifyPromotions: boolean;
    } | null;
  },
  category: string,
  notificationType?: string
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
      return prefs.enableAdvertisingPush &&
        (notificationType !== 'promotion' || prefs.notifyPromotions);

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
  type: string;
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
  const preferenceType = notification.type === 'promo' && !notification.targetMotelId
    ? 'promotion'
    : notification.type;

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
      if (shouldSendNotificationByCategory(user, category, preferenceType)) {
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
      if (shouldSendNotificationByCategory(user, category, preferenceType)) {
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
      if (shouldSendNotificationByCategory(fav.user, category, preferenceType)) {
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
      if (shouldSendNotificationByCategory(user, category, preferenceType)) {
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
          advertisingEnabled: true,
        },
        select: {
          token: true,
        },
      });
      tokens.push(...guestTokens.map((pt) => pt.token));
    }
  }

  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length > 0) {
    const results = await sendPushNotifications(uniqueTokens, {
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
        processingAt: null,
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
      processingAt: null,
      totalSent: 0,
      totalFailed: 0,
      totalSkipped: skipped,
      errorMessage: skipped > 0 ? 'All users opted out of this category' : 'No recipients found',
    },
  });

  return { sent: 0, failed: 0, skipped };
}

async function claimScheduledNotification(id: string) {
  const staleBefore = new Date(Date.now() - 10 * 60_000);
  const claimed = await prisma.scheduledNotification.updateMany({
    where: {
      id,
      sent: false,
      OR: [{ processingAt: null }, { processingAt: { lt: staleBefore } }],
    },
    data: { processingAt: new Date(), attemptCount: { increment: 1 } },
  });
  if (claimed.count !== 1) return null;
  return prisma.scheduledNotification.findUnique({ where: { id } });
}

async function releaseFailedNotification(id: string, attemptCount: number, error: unknown) {
  const exhausted = attemptCount >= 5;
  await prisma.scheduledNotification.update({
    where: { id },
    data: {
      processingAt: null,
      sent: exhausted,
      sentAt: exhausted ? new Date() : null,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    },
  });
}

export async function processScheduledNotificationById(id: string) {
  const existing = await prisma.scheduledNotification.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  if (existing.sent) {
    return {
      sent: existing.totalSent,
      failed: existing.totalFailed,
      skipped: existing.totalSkipped,
    };
  }

  const notification = await claimScheduledNotification(id);
  if (!notification) return { sent: 0, failed: 0, skipped: 0 };
  try {
    return await deliverScheduledNotification(notification);
  } catch (error) {
    await releaseFailedNotification(id, notification.attemptCount, error);
    throw error;
  }
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
      const claimed = await claimScheduledNotification(notification.id);
      if (!claimed) continue;
      try {
        const result = await deliverScheduledNotification(claimed);
        totalSent += result.sent;
        totalFailed += result.failed;
      } catch (error) {
        console.error(`Error processing scheduled notification ${notification.id}:`, error);
        totalFailed++;

        await releaseFailedNotification(claimed.id, claimed.attemptCount, error);
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
