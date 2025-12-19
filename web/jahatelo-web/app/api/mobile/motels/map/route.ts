import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getThumbnail } from '../../mappers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/motels/map
 *
 * Endpoint optimizado para obtener moteles con coordenadas para mapas.
 * Retorna solo los campos necesarios: id, name, city, latitude, longitude, slug, featuredPhoto
 */
export async function GET() {
  try {
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        // Solo moteles con coordenadas válidas
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        featuredPhoto: true,
        photos: {
          select: {
            url: true,
            kind: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        promos: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            validFrom: true,
            validUntil: true,
          },
        },
      },
    });

    // Mapear a formato simple para mapa
    const mapData = motels.map((motel) => {
      // Verificar si tiene promos activas
      const now = new Date();
      const hasActivePromo = motel.promos.some((promo) => {
        if (promo.validFrom && promo.validFrom > now) return false;
        if (promo.validUntil && promo.validUntil < now) return false;
        return true;
      });

      return {
        id: motel.id,
        name: motel.name,
        slug: motel.slug,
        city: motel.city,
        neighborhood: motel.neighborhood,
        latitude: motel.latitude!,
        longitude: motel.longitude!,
        featuredPhoto: getThumbnail(motel.photos, motel.featuredPhoto),
        hasPromo: hasActivePromo,
      };
    });

    return NextResponse.json({
      success: true,
      count: mapData.length,
      motels: mapData,
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos del mapa',
      },
      { status: 500 }
    );
  }
}
