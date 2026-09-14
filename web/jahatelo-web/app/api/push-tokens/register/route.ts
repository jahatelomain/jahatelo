import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PushTokenDeleteSchema, PushTokenRegisterSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

/**
 * POST /api/push-tokens/register
 * Registra o actualiza un token de notificaciones push
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { token, deviceId, deviceType, deviceName, appVersion, advertisingEnabled } =
      PushTokenRegisterSchema.parse(sanitized);
    const authToken = await getTokenFromRequest(request as never);
    const authenticatedUser = authToken ? await verifyToken(authToken) : null;
    if (authToken && !authenticatedUser) {
      return NextResponse.json({ error: 'Token de sesión inválido' }, { status: 401 });
    }

    // Validar que sea un token de Expo válido
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      return NextResponse.json(
        { error: 'Token de Expo inválido' },
        { status: 400 }
      );
    }

    // Si hay deviceId, desactivar otros tokens del mismo dispositivo
    if (deviceId) {
      await prisma.pushToken.updateMany({
        where: {
          deviceId,
          token: {
            not: token, // No desactivar el token actual si ya existe
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Buscar si el token ya existe
    const existingToken = await prisma.pushToken.findUnique({
      where: { token },
    });

    let pushToken;

    if (existingToken) {
      // Actualizar token existente
      pushToken = await prisma.pushToken.update({
        where: { token },
        data: {
          // La pertenencia nunca se acepta desde el body: deriva únicamente
          // de la sesión actual y se libera al volver al modo invitado.
          userId: authenticatedUser?.id ?? null,
          deviceId: deviceId || existingToken.deviceId,
          deviceType: deviceType || existingToken.deviceType,
          deviceName: deviceName || existingToken.deviceName,
          appVersion: appVersion || existingToken.appVersion,
          isActive: true,
          ...(advertisingEnabled !== undefined && { advertisingEnabled }),
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Crear nuevo token
      pushToken = await prisma.pushToken.create({
        data: {
          token,
          userId: authenticatedUser?.id ?? null,
          deviceId: deviceId || null,
          deviceType: deviceType || null,
          deviceName: deviceName || null,
          appVersion: appVersion || null,
          isActive: true,
          advertisingEnabled: advertisingEnabled ?? true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pushToken: {
        id: pushToken.id,
        token: pushToken.token,
        isActive: pushToken.isActive,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Error al registrar token de notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push-tokens/register
 * Desactiva un token de notificaciones push
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const { token } = PushTokenDeleteSchema.parse(sanitized);

    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Token desactivado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error deleting push token:', error);
    return NextResponse.json(
      { error: 'Error al desactivar token' },
      { status: 500 }
    );
  }
}
