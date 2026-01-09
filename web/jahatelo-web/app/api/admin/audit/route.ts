import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'audit');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const query = searchParams.get('q');

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    if (query) {
      where.OR = [
        { entityId: { contains: query, mode: 'insensitive' } },
        { action: { contains: query, mode: 'insensitive' } },
        { entityType: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener auditoría' },
      { status: 500 }
    );
  }
}
