import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

/**
 * GET /api/admin/inbox
 * Lista todos los mensajes de contacto (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
    if (access.error) return access.error;

    const messages = await prisma.contactMessage.findMany({
      orderBy: [
        { isRead: 'asc' },  // No leídos primero
        { createdAt: 'desc' }, // Más recientes primero
      ],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}
