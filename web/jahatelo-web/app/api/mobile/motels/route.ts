import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { mapMotelToListItem } from '../mappers';
import { normalizeLocalUrl, normalizeLocalUrls } from '@/lib/normalizeLocalUrl';
import { MobileMotelsQuerySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// Helper to get plan priority for sorting
const getPlanPriority = (plan: string | null | undefined): number => {
  switch (plan) {
    case 'DIAMOND': return 1;
    case 'GOLD': return 2;
    case 'BASIC': return 3;
    case 'FREE': return 4;
    default: return 4;
  }
};

// Helper to normalize text: remove accents, lowercase, trim
const normalizeText = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  // Normaliza NFD (descompone caracteres con acentos) y elimina marcas diacríticas
  return trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Helper to trim and ensure undefined when empty (sin normalización de acentos)
const normalize = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

// Helper to build string filters with case-insensitive contains
const containsFilter = (value?: string) =>
  value
    ? {
        contains: value,
        mode: 'insensitive' as const,
      }
    : undefined;

const equalsFilter = (value?: string) =>
  value
    ? {
        equals: value,
        mode: 'insensitive' as const,
      }
    : undefined;

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    const normalizeList = (list?: string[] | null) =>
      normalizeLocalUrls(list, baseUrl);
    const { searchParams } = new URL(request.url);
    const queryResult = MobileMotelsQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      city: searchParams.get('city') || undefined,
      neighborhood: searchParams.get('neighborhood') || undefined,
      amenity: searchParams.get('amenity') || undefined,
      featured: searchParams.get('featured') || undefined,
      ids: searchParams.get('ids') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }

    // Parse query params
    const search = normalizeText(queryResult.data.search);
    const city = normalize(queryResult.data.city);
    const neighborhood = normalize(queryResult.data.neighborhood);
    const amenity = normalize(queryResult.data.amenity);
    const featured = queryResult.data.featured;
    const idsParam = queryResult.data.ids;
    const page = queryResult.data.page || 1;
    const limit = Math.min(queryResult.data.limit || 20, 50);

    // Build where clause
    const where: Prisma.MotelWhereInput = {
      status: 'APPROVED',
      isActive: true,
    };

    // Accumulate OR conditions
    const orConditions: Prisma.MotelWhereInput[] = [];

    // Search: match in name, description, city, neighborhood
    // NOTA: Para búsqueda sin acentos, usamos raw SQL en los filtros contains
    if (search) {
      const filter = containsFilter(search);
      orConditions.push(
        { name: filter },
        { description: filter },
        { city: filter },
        { neighborhood: filter }
      );
    }

    // IDs filter: can be ids or slugs (add to OR without overwriting)
    if (idsParam) {
      const idsArray = idsParam.split(',').map((id) => id.trim());
      orConditions.push({ id: { in: idsArray } }, { slug: { in: idsArray } });
    }

    // Assign OR conditions if any
    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Specific filters (AND conditions)
    // NOTA: Para city y neighborhood usamos coincidencia parcial normalizada
    if (city) {
      where.city = containsFilter(city);
    }

    if (neighborhood) {
      where.neighborhood = containsFilter(neighborhood);
    }

    if (amenity) {
      where.motelAmenities = {
        some: {
          amenity: {
            name: containsFilter(amenity),
          },
        },
      };
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Para búsquedas con search, usamos raw SQL para normalizar acentos en ambos lados
    let motels: any[] = [];
    let total = 0;

    if (search && orConditions.length > 0) {
      // Query con normalización de acentos usando SQL
      // Usamos TRANSLATE para remover acentos (compatible con Postgres)
      const searchPattern = `%${search}%`;

      const rawQuery = Prisma.sql`
        SELECT m.* FROM "Motel" m
        WHERE m.status = 'APPROVED'
          AND m."isActive" = true
          AND (
            LOWER(TRANSLATE(m.name, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(COALESCE(m.description, ''), 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(m.city, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(m.neighborhood, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
          )
        ORDER BY
          CASE m.plan
            WHEN 'DIAMOND' THEN 1
            WHEN 'GOLD' THEN 2
            WHEN 'BASIC' THEN 3
            WHEN 'FREE' THEN 4
            ELSE 4
          END ASC,
          m."ratingAvg" DESC,
          m."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      const rawMotels: any[] = await prisma.$queryRaw(rawQuery);

      // Obtener conteo total
      const countQuery = Prisma.sql`
        SELECT COUNT(*) as count FROM "Motel" m
        WHERE m.status = 'APPROVED'
          AND m."isActive" = true
          AND (
            LOWER(TRANSLATE(m.name, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(COALESCE(m.description, ''), 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(m.city, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
            OR LOWER(TRANSLATE(m.neighborhood, 'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ', 'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')) LIKE LOWER(${searchPattern})
          )
      `;

      const countResult: any[] = await prisma.$queryRaw(countQuery);
      total = Number(countResult[0]?.count || 0);

      // Obtener moteles completos con relaciones
      if (rawMotels.length > 0) {
        const motelIds = rawMotels.map(m => m.id);
        motels = await prisma.motel.findMany({
          where: { id: { in: motelIds } },
          include: {
            photos: {
              orderBy: { order: 'asc' },
            },
            motelAmenities: {
              include: {
                amenity: true,
              },
            },
            rooms: {
              where: { isActive: true },
              select: {
                price1h: true,
                price1_5h: true,
                price2h: true,
                price3h: true,
                price12h: true,
                price24h: true,
                priceNight: true,
                isActive: true,
                amenities: {
                  select: {
                    amenity: {
                      select: { id: true, name: true, icon: true },
                    },
                  },
                },
              },
            },
            promos: {
              where: {
                isActive: true,
                isGlobal: true,
              },
            },
          },
          orderBy: [
            { ratingAvg: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        // Ordenar por plan en memoria
        motels.sort((a: any, b: any) => {
          const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
          if (planDiff !== 0) return planDiff;

          // Si tienen el mismo plan, ordenar por rating
          const ratingDiff = (b.ratingAvg || 0) - (a.ratingAvg || 0);
          if (ratingDiff !== 0) return ratingDiff;

          // Si tienen el mismo rating, ordenar por fecha de creación
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
    } else {
      // Query normal con Prisma para otros casos
      [total, motels] = await Promise.all([
        prisma.motel.count({ where }),
        prisma.motel.findMany({
          where,
          include: {
            photos: {
              orderBy: { order: 'asc' },
            },
            motelAmenities: {
              include: {
                amenity: true,
              },
            },
            rooms: {
              where: { isActive: true },
              select: {
                price1h: true,
                price1_5h: true,
                price2h: true,
                price3h: true,
                price12h: true,
                price24h: true,
                priceNight: true,
                isActive: true,
                amenities: {
                  select: {
                    amenity: {
                      select: { id: true, name: true, icon: true },
                    },
                  },
                },
              },
            },
            promos: {
              where: {
                isActive: true,
                isGlobal: true,
              },
            },
          },
          orderBy: [
            { ratingAvg: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
      ]);

      // Ordenar por plan en memoria
      motels.sort((a: any, b: any) => {
        const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
        if (planDiff !== 0) return planDiff;

        // Si tienen el mismo plan, ordenar por rating
        const ratingDiff = (b.ratingAvg || 0) - (a.ratingAvg || 0);
        if (ratingDiff !== 0) return ratingDiff;

        // Si tienen el mismo rating, ordenar por fecha de creación
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Map motels to mobile format
    const data = motels
      .map(mapMotelToListItem)
      .map((motel) => ({
        ...motel,
        thumbnail: normalizeLocalUrl(motel.thumbnail, baseUrl),
        featuredPhoto: normalizeLocalUrl(motel.featuredPhoto, baseUrl),
        promoImageUrl: normalizeLocalUrl(motel.promoImageUrl, baseUrl),
        photos: normalizeList(motel.photos) || [],
      }));

    // Timestamp del motel (o promo) más recientemente actualizado para cache-busting en la app.
    // Se incluyen las promos para que un cambio de imagen de promo invalide el cache inmediatamente.
    const latestUpdatedAt = motels.reduce((max, m: any) => {
      let t = m.updatedAt ? new Date(m.updatedAt).getTime() : 0;
      if (Array.isArray(m.promos)) {
        for (const promo of m.promos) {
          const pt = promo.updatedAt ? new Date(promo.updatedAt).getTime() : 0;
          if (pt > t) t = pt;
        }
      }
      return t > max ? t : max;
    }, 0);

    return NextResponse.json(
      {
        data,
        meta: {
          page,
          limit,
          total,
          latestUpdatedAt,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error in GET /api/mobile/motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch motels' },
      { status: 500 }
    );
  }
}
