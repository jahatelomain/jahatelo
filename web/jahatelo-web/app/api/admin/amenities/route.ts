import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AMENITY_ICONS } from '@/lib/amenityIcons';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { AdminPaginationSchema, AmenitySchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

// GET all amenities
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const queryResult = z
      .object({
        type: z.enum(['ROOM', 'MOTEL', 'BOTH']).optional(),
        search: z.string().max(100).optional(),
      })
      .safeParse({
        type: searchParams.get('type') || undefined,
        search: searchParams.get('search') || undefined,
      });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { type, search: searchQuery } = queryResult.data;
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

    const searchFilter = searchQuery?.trim();
    const where: Prisma.AmenityWhereInput = {
      ...(type ? { type } : {}),
      ...(searchFilter
        ? { name: { contains: searchFilter, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };
    const total = await prisma.amenity.count({ where });

    const amenities = await prisma.amenity.findMany({
      where,
      include: {
        _count: {
          select: {
            roomAmenities: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    if (!usePagination) {
      return NextResponse.json(amenities ?? []);
    }

    return NextResponse.json({
      data: amenities ?? [],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST create new amenity
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'amenities');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = AmenitySchema.parse(sanitized);

    // Check if amenity already exists
    const existing = await prisma.amenity.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un amenity con ese nombre' },
        { status: 400 }
      );
    }

    if (validated.icon && !AMENITY_ICONS.some((item) => item.value === validated.icon)) {
      return NextResponse.json(
        { error: 'Ícono inválido' },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenity.create({
      data: {
        name: validated.name,
        type: validated.type || null,
        icon: validated.icon || null,
        description: validated.description || null,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'Amenity',
      entityId: amenity.id,
      metadata: { name: amenity.name },
    });

    return NextResponse.json(amenity, { status: 201 });
  } catch (error) {
    console.error('Error creating amenity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al crear amenity' },
      { status: 500 }
    );
  }
}
