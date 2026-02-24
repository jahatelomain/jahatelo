import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Páginas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/mapa`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/registrar-motel`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/soporte`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Páginas dinámicas de moteles
  let motelRoutes: MetadataRoute.Sitemap = [];
  let cityRoutes: MetadataRoute.Sitemap = [];
  let neighborhoodRoutes: MetadataRoute.Sitemap = [];

  try {
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    motelRoutes = motels
      .filter((m) => m.slug)
      .map((motel) => ({
        url: `${BASE_URL}/motels/${motel.slug}`,
        lastModified: motel.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

    // Páginas de ciudades
    const cities = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        city: { not: undefined },
      },
      select: {
        city: true,
        updatedAt: true,
      },
      distinct: ['city'],
    });

    cityRoutes = cities
      .filter((m) => m.city)
      .map((city) => ({
        url: `${BASE_URL}/ciudad/${city.city!.toLowerCase().replace(/\s+/g, '-')}`,
        lastModified: city.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));

    // Páginas de barrios
    const neighborhoods = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        city: { not: undefined },
        neighborhood: { not: undefined },
      },
      select: {
        city: true,
        neighborhood: true,
        updatedAt: true,
      },
      distinct: ['city', 'neighborhood'],
    });

    neighborhoodRoutes = neighborhoods.map((nb) => ({
      url: `${BASE_URL}/ciudad/${nb.city!.toLowerCase().replace(/\s+/g, '-')}/${nb.neighborhood!.toLowerCase().replace(/\s+/g, '-')}`,
      lastModified: nb.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // Si falla la DB en build, continuar sin las rutas dinámicas
  }

  return [...staticRoutes, ...motelRoutes, ...cityRoutes, ...neighborhoodRoutes];
}
