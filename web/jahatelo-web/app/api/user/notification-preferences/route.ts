import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/notification-preferences
 * Obtiene las preferencias de notificaciones del usuario
 * Query params:
 *   - userId: ID del usuario (requerido)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Buscar preferencias existentes o crear con valores por defecto
    let preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    // Si no existen preferencias, crear con valores por defecto
    if (!preferences) {
      preferences = await prisma.userNotificationPreferences.create({
        data: { userId },
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al obtener preferencias' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/notification-preferences
 * Actualiza las preferencias de notificaciones del usuario
 * Body: { userId, ...preferences }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...preferencesData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Filtrar solo los campos válidos del modelo
    const validFields = [
      'enableNotifications',
      'enableEmail',
      'enablePush',
      'enableAdvertisingPush',
      'enableSecurityPush',
      'enableMaintenancePush',
      'notifyNewPromos',
      'notifyPriceDrops',
      'notifyUpdates',
      'notifyReviewReplies',
      'notifyReviewLikes',
      'notifyPromotions',
      'notifyNewMotels',
      'notifyContactMessages',
      'notifyNewProspects',
      'notifyPaymentReminders',
      'notifyMotelApprovals',
    ];

    const filteredData: any = {};
    for (const field of validFields) {
      if (field in preferencesData && typeof preferencesData[field] === 'boolean') {
        filteredData[field] = preferencesData[field];
      }
    }

    // Actualizar o crear preferencias
    const preferences = await prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...filteredData,
      },
      update: filteredData,
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/notification-preferences
 * Crea preferencias de notificaciones con valores por defecto
 * Body: { userId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existen preferencias
    const existing = await prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        preferences: existing,
        message: 'Las preferencias ya existen',
      });
    }

    // Crear preferencias con valores por defecto
    const preferences = await prisma.userNotificationPreferences.create({
      data: { userId },
    });

    return NextResponse.json(
      {
        success: true,
        preferences,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification preferences:', error);
    return NextResponse.json(
      { error: 'Error al crear preferencias' },
      { status: 500 }
    );
  }
}
