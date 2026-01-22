import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IdSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams?.id ?? '';
    const decoded = decodeURIComponent(rawId).trim();
    const id = IdSchema.parse(decoded);

    const notification = await prisma.scheduledNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ID inválido', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al obtener notificación' }, { status: 500 });
  }
}
