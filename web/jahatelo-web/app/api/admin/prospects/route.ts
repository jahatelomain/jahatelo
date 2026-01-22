import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdminPaginationSchema, AdminProspectCreateSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * GET /api/admin/prospects
 * Lista todos los prospects (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'prospects');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const paginationResult = AdminPaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: paginationResult.error.errors }, { status: 400 });
    }
    const usePagination = searchParams.has('page') || searchParams.has('limit');
    const page = paginationResult.data.page ?? 1;
    const limit = paginationResult.data.limit ?? 20;

    const total = await prisma.motelProspect.count();

    const prospects = await prisma.motelProspect.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(prospects);
    }

    return NextResponse.json({
      data: prospects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Error al obtener prospects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prospects
 * Crea un prospect manualmente desde el admin (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'prospects');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AdminProspectCreateSchema.parse(sanitized);
    const phoneDigits = validated.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return NextResponse.json(
        { error: 'El teléfono debe tener al menos 7 dígitos' },
        { status: 400 }
      );
    }
    const finalChannel = validated.channel || 'MANUAL';

    // Crear prospect
    const prospect = await prisma.motelProspect.create({
      data: {
        contactName: validated.contactName.trim(),
        phone: validated.phone.trim(),
        motelName: validated.motelName.trim(),
        channel: finalChannel,
        notes: validated.notes?.trim() || null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Prospect',
      entityId: prospect.id,
      metadata: { motelName: prospect.motelName, channel: prospect.channel },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error('Error creating prospect:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear prospect' },
      { status: 500 }
    );
  }
}
