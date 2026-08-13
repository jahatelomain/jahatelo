import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type Motel } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';
import { MobileMotelsQuerySchema } from '@/lib/validations/schemas';
import { mapMotelToListItem } from '../mappers';
import { normalizeRelaxedSearch, relaxedSearchSql } from '@/lib/search/relaxedSearch';


const include = {
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
        select: { amenity: { select: { id: true, name: true, icon: true } } },
      },
      dayRates: true,
      weekdayRates: true,
    },
  },
  promos: {
    where: { isActive: true },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.MotelInclude;

type MotelWithListRelations = Prisma.MotelGetPayload<{ include: typeof include }>;
type SearchId = { id: string };

const normalize = (value?: string | null) => value?.trim() || undefined;
const planPriority = (plan: Motel['plan']) => {
  if (plan === 'DIAMOND') return 1;
  if (plan === 'GOLD') return 2;
  if (plan === 'BASIC') return 3;
  return 4;
};

const compareMotels = (a: MotelWithListRelations, b: MotelWithListRelations) =>
  planPriority(a.plan) - planPriority(b.plan) ||
  Number(b.isFeatured) - Number(a.isFeatured) ||
  (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
  b.createdAt.getTime() - a.createdAt.getTime();

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const parsed = MobileMotelsQuerySchema.safeParse({
      search: params.get('search') || undefined,
      city: params.get('city') || undefined,
      amenity: params.get('amenity') || undefined,
      featured: params.get('featured') || undefined,
      promos: params.get('promos') || undefined,
      ids: params.get('ids') || undefined,
      page: params.get('page') || undefined,
      limit: params.get('limit') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const search = normalizeRelaxedSearch(parsed.data.search);
    const city = normalize(parsed.data.city);
    const amenity = normalize(parsed.data.amenity);
    const ids = parsed.data.ids?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 20;
    const now = new Date();
    const and: Prisma.MotelWhereInput[] = [];

    if (search) {
      const pattern = `%${search}%`;
      const matches = await prisma.$queryRaw<SearchId[]>(Prisma.sql`
        SELECT m.id FROM "Motel" m
        WHERE ${relaxedSearchSql(Prisma.raw('m.name'))} LIKE ${pattern}
          OR ${relaxedSearchSql(Prisma.raw('m.description'))} LIKE ${pattern}
          OR ${relaxedSearchSql(Prisma.raw('m.city'))} LIKE ${pattern}
      `);
      and.push({ id: { in: matches.map(({ id }) => id) } });
    }

    if (ids.length > 0) {
      and.push({ OR: [{ id: { in: ids } }, { slug: { in: ids } }] });
    }
    if (city) and.push({ city: { contains: city, mode: 'insensitive' } });
    if (parsed.data.featured !== undefined) and.push({ isFeatured: parsed.data.featured });

    if (amenity) {
      const amenityMatch: Prisma.AmenityWhereInput = {
        OR: [{ id: amenity }, { name: { contains: amenity, mode: 'insensitive' } }],
      };
      and.push({
        rooms: {
          some: {
            isActive: true,
            amenities: { some: { amenity: amenityMatch } },
          },
        },
      });
    }

    if (parsed.data.promos !== undefined) {
      and.push(
        parsed.data.promos
          ? {
              promos: {
                some: {
                  isActive: true,
                  AND: [
                    { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                    { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
                  ],
                },
              },
            }
          : {
              promos: {
                none: {
                  isActive: true,
                  AND: [
                    { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                    { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
                  ],
                },
              },
            },
      );
    }

    const where: Prisma.MotelWhereInput = {
      status: 'APPROVED',
      isActive: true,
      ...(and.length > 0 ? { AND: and } : {}),
    };

    // El volumen público es acotado. Ordenar antes de paginar garantiza el mismo
    // ranking por plan en app y web, algo que Prisma no expresa para este enum.
    const allMotels = await prisma.motel.findMany({ where, include });
    allMotels.sort(compareMotels);
    const total = allMotels.length;
    const offset = (page - 1) * limit;
    const motels = allMotels.slice(offset, offset + limit);

    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    const data = motels.map(mapMotelToListItem).map((motel) => ({
      ...motel,
      thumbnail: normalizeLocalUrl(motel.thumbnail, baseUrl),
      featuredPhoto: normalizeLocalUrl(motel.featuredPhoto, baseUrl),
      featuredPhotoWeb: normalizeLocalUrl(motel.featuredPhotoWeb, baseUrl),
      promoImageUrl: normalizeLocalUrl(motel.promoImageUrl, baseUrl),
    }));

    const latestUpdatedAt = motels.reduce((latest, motel) => {
      const timestamps = [
        motel.updatedAt.getTime(),
        ...motel.promos.map((promo) => promo.updatedAt.getTime()),
      ];
      return Math.max(latest, ...timestamps);
    }, 0);

    return NextResponse.json(
      { data, meta: { page, limit, total, latestUpdatedAt } },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error in GET /api/mobile/motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch motels' }, { status: 500 });
  }
}
