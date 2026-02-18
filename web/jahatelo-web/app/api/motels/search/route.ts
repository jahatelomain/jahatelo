import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const SearchParamsSchema = z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  amenities: z.string().max(500).optional(),
  promos: z.enum(['1']).optional(),
  featured: z.enum(['1']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const getPlanPriority = (plan: string | null | undefined): number => {
  switch (plan) {
    case 'DIAMOND': return 1;
    case 'GOLD':    return 2;
    case 'BASIC':   return 3;
    default:        return 4;
  }
};

// Normaliza texto: minúsculas + quita acentos (igual que /api/mobile/motels)
const normalizeText = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Tabla de caracteres acentuados para SQL TRANSLATE (Postgres)
const ACCENT_FROM = 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ';
const ACCENT_TO   = 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const parsed = SearchParamsSchema.safeParse({
      search:    searchParams.get('search')    ?? undefined,
      city:      searchParams.get('city')      ?? undefined,
      amenities: searchParams.get('amenities') ?? undefined,
      promos:    searchParams.get('promos')    ?? undefined,
      featured:  searchParams.get('featured')  ?? undefined,
      page:      searchParams.get('page')      ?? undefined,
      limit:     searchParams.get('limit')     ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', motels: [] },
        { status: 400 }
      );
    }

    const { promos, featured } = parsed.data;
    const search   = normalizeText(parsed.data.search);
    const city     = parsed.data.city?.trim() || undefined;
    const amenities = parsed.data.amenities;
    const page     = parsed.data.page  ?? 1;
    const limit    = parsed.data.limit ?? 50;
    const skip     = (page - 1) * limit;

    // ── Construcción del WHERE base ───────────────────────────────────────────
    const whereClause: Prisma.MotelWhereInput = {
      status: 'APPROVED',
      isActive: true,
    };

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    if (amenities) {
      const tokens = amenities
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      if (tokens.length > 0) {
        // Soporta tanto IDs (UUID) como nombres.
        // Busca en amenidades de motel (motelAmenities) Y de habitación (rooms.amenities)
        whereClause.OR = [
          ...(whereClause.OR as Prisma.MotelWhereInput[] || []),
          {
            motelAmenities: {
              some: {
                amenity: {
                  OR: [
                    { id:   { in: tokens } },
                    { name: { in: tokens, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
          {
            rooms: {
              some: {
                amenities: {
                  some: {
                    amenity: {
                      OR: [
                        { id:   { in: tokens } },
                        { name: { in: tokens, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              },
            },
          },
        ];
      }
    }

    if (promos === '1') {
      whereClause.promos = { some: { isActive: true } };
    }

    if (featured === '1') {
      whereClause.isFeatured = true;
    }

    // ── Includes comunes ──────────────────────────────────────────────────────
    const include = {
      photos: { orderBy: { order: 'asc' as const }, take: 3 },
      rooms: {
        where: { isActive: true },
        select: {
          price1h:   true,
          price1_5h: true,
          price2h:   true,
          price3h:   true,
          price12h:  true,
          price24h:  true,
          priceNight: true,
          isActive:  true,
          amenities: {
            select: { amenity: { select: { id: true, name: true, icon: true } } },
          },
        },
      },
      promos: {
        where: { isActive: true, isGlobal: true },
        select: {
          id: true, title: true, description: true,
          imageUrl: true, validFrom: true, validUntil: true,
        },
        take: 1,
      },
    } satisfies Prisma.MotelInclude;

    // ── Query con normalización de acentos (SQL TRANSLATE) cuando hay búsqueda ─
    let motels: any[] = [];
    let total = 0;

    if (search) {
      const pattern = `%${search}%`;

      const rawQuery = Prisma.sql`
        SELECT m.* FROM "Motel" m
        WHERE m.status = 'APPROVED'
          AND m."isActive" = true
          AND (
            LOWER(TRANSLATE(m.name,          ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(COALESCE(m.description, ''), ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(m.city,        ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(m.neighborhood,${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
          )
        LIMIT ${limit} OFFSET ${skip}
      `;

      const countQuery = Prisma.sql`
        SELECT COUNT(*) as count FROM "Motel" m
        WHERE m.status = 'APPROVED'
          AND m."isActive" = true
          AND (
            LOWER(TRANSLATE(m.name,          ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(COALESCE(m.description, ''), ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(m.city,        ${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
            OR LOWER(TRANSLATE(m.neighborhood,${ACCENT_FROM}, ${ACCENT_TO})) LIKE LOWER(${pattern})
          )
      `;

      const rawMotels    = await prisma.$queryRaw<any[]>(rawQuery);
      const countResult  = await prisma.$queryRaw<any[]>(countQuery);

      total = Number(countResult[0]?.count ?? 0);

      if (rawMotels.length > 0) {
        const ids = rawMotels.map((m: any) => m.id);
        motels = await prisma.motel.findMany({
          where: { id: { in: ids } },
          include,
        });
      }
    } else {
      [total, motels] = await Promise.all([
        prisma.motel.count({ where: whereClause }),
        prisma.motel.findMany({
          where: whereClause,
          include,
          skip,
          take: limit,
        }),
      ]);
    }

    // ── Ordenamiento en memoria: plan → isFeatured → rating → fecha ───────────
    motels.sort((a: any, b: any) => {
      const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
      if (planDiff !== 0) return planDiff;
      if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1;
      const ratingDiff = (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      motels,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error searching motels:', error);
    return NextResponse.json(
      { error: 'Error searching motels', motels: [] },
      { status: 500 }
    );
  }
}
