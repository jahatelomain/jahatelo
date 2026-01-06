import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';

/**
 * GET /api/admin/prospects
 * Lista todos los prospects (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const prospects = await prisma.motelProspect.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Error al obtener prospects' },
      { status: 500 }
    );
  }
}
