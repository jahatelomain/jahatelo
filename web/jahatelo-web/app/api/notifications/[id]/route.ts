import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Log para debugging
    console.log('🔍 Buscando notificación con ID:', id);

    const notification = await prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      console.warn('❌ Notificación no encontrada en BD. ID solicitado:', id);

      // Verificar si hay notificaciones similares
      const allNotifications = await prisma.scheduledNotification.findMany({
        select: { id: true, title: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('📋 Últimas 5 notificaciones en BD:', allNotifications);

      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    console.log('✅ Notificación encontrada:', notification.title);
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json({ error: 'Error al obtener notificación' }, { status: 500 });
  }
}
