import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notification = await prisma.scheduledNotification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json({ error: 'Error al obtener notificación' }, { status: 500 });
  }
}
