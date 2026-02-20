import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { mapMotelToDetail } from '../../mappers';
import { normalizeLocalUrl, normalizeLocalUrls } from '@/lib/normalizeLocalUrl';
import { MobileMotelSlugSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    const normalizeList = (list?: string[] | null) =>
      normalizeLocalUrls(list, baseUrl);
    const { slug } = await params;
    const slugResult = MobileMotelSlugSchema.safeParse({ slug });
    if (!slugResult.success) {
      return NextResponse.json({ error: 'Invalid slug', details: slugResult.error.issues }, { status: 400 });
    }
    const resolvedSlug = slugResult.data.slug;

    // Common include for both queries
    const commonInclude = {
      photos: {
        orderBy: { order: 'asc' as const },
      },

      rooms: {
        where: { isActive: true },
        orderBy: [{ isFeatured: 'desc' as const }, { name: 'asc' as const }],
        include: {
          photos: {
            orderBy: { order: 'asc' as const },
          },
          roomPhotos: {
            orderBy: { order: 'asc' as const },
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
        },
      },
      menuCategories: {
        include: {
          items: {
            orderBy: { name: 'asc' as const },
          },
        },
        orderBy: { order: 'asc' as const },
      },
      promos: {
        where: { isActive: true },
      },
      schedules: {
        orderBy: { dayOfWeek: 'asc' as const },
      },
    };

    // Try to find by slug first, then by id
    let motel = await prisma.motel.findUnique({
      where: { slug: resolvedSlug },
      include: commonInclude,
    });

    // If not found by slug, try by id
    if (!motel) {
      motel = await prisma.motel.findUnique({
        where: { id: resolvedSlug },
        include: commonInclude,
      });
    }

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    // Check if motel is approved and active
    if (motel.status !== 'APPROVED' || !motel.isActive || motel.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Motel not available' },
        { status: 404 }
      );
    }

    const data = mapMotelToDetail(motel);
    const normalized = {
      ...data,
      thumbnail: normalizeLocalUrl(data.thumbnail, baseUrl),
      featuredPhoto: normalizeLocalUrl(data.featuredPhoto, baseUrl),
      photos: normalizeList(data.photos) || [],
      allPhotos: normalizeList(data.allPhotos) || [],
      promos: (data.promos || []).map((promo) => ({
        ...promo,
        imageUrl: normalizeLocalUrl(promo.imageUrl, baseUrl),
      })),
      menu: (data.menu || []).map((cat) => ({
        ...cat,
        items: (cat.items || []).map((item) => ({
          ...item,
          photoUrl: normalizeLocalUrl(item.photoUrl, baseUrl),
        })),
      })),
      rooms: (data.rooms || []).map((room) => ({
        ...room,
        photos: normalizeList(room.photos) || [],
      })),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error in GET /api/mobile/motels/[slug]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid slug', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch motel' },
      { status: 500 }
    );
  }
}
