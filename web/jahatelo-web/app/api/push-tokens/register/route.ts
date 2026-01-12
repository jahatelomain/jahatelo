import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/push-tokens/register
 * Registra o actualiza un token de notificaciones push
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, deviceId, deviceType, deviceName, appVersion, userId } = body;

    // Validación básica
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
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
          userId: userId || existingToken.userId,
          deviceId: deviceId || existingToken.deviceId,
          deviceType: deviceType || existingToken.deviceType,
          deviceName: deviceName || existingToken.deviceName,
          appVersion: appVersion || existingToken.appVersion,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Crear nuevo token
      pushToken = await prisma.pushToken.create({
        data: {
          token,
          userId: userId || null,
          deviceId: deviceId || null,
          deviceType: deviceType || null,
          deviceName: deviceName || null,
          appVersion: appVersion || null,
          isActive: true,
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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Token desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting push token:', error);
    return NextResponse.json(
      { error: 'Error al desactivar token' },
      { status: 500 }
    );
  }
}
