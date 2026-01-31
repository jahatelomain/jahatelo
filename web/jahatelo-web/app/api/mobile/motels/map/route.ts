import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache por 60 segundos

/**
 * GET /api/mobile/motels/map
 *
 * Endpoint ULTRA OPTIMIZADO para mapas - solo datos mínimos necesarios
 * Retorna: id, name, slug, latitude, longitude, plan
 */
export async function GET() {
  try {
    EmptySchema.parse({});
    // Query optimizada: sin joins innecesarios, solo campos esenciales
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
        plan: true,
        isFeatured: true,
        featuredPhoto: true,
        featuredPhotoWeb: true,
        featuredPhotoApp: true,
        promos: {
          where: { isActive: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: motels.length,
        motels: motels.map(m => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          latitude: m.latitude!,
          longitude: m.longitude!,
          plan: m.plan,
          isFeatured: m.isFeatured,
          featuredPhoto: m.featuredPhotoApp ?? m.featuredPhotoWeb ?? m.featuredPhoto ?? null,
          hasPromo: m.promos.length > 0,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching map data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos del mapa',
      },
      { status: 500 }
    );
  }
}
