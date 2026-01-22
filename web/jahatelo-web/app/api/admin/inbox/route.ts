import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminPaginationSchema, EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/inbox
 * Lista todos los mensajes de contacto (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = z
      .object({
        status: z.enum(['read', 'unread']).optional(),
      })
      .safeParse({
        status: searchParams.get('status') || undefined,
      });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { status } = queryResult.data;
    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: paginationResult.error.issues }, { status: 400 });
    }
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;
    EmptySchema.parse({});
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'inbox');
    if (access.error) return access.error;

    const baseWhere = {};
    const dataWhere = {
      ...baseWhere,
      ...(status ? { isRead: status === 'read' } : {}),
    };
    const total = await prisma.contactMessage.count({ where: dataWhere });
    const unreadCount = await prisma.contactMessage.count({ where: { ...baseWhere, isRead: false } });
    const readCount = await prisma.contactMessage.count({ where: { ...baseWhere, isRead: true } });

    const messages = await prisma.contactMessage.findMany({
      where: dataWhere,
      orderBy: [
        { isRead: 'asc' },  // No leídos primero
        { createdAt: 'desc' }, // Más recientes primero
      ],
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(messages);
    }

    return NextResponse.json({
      data: messages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          readCount,
          unreadCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}
