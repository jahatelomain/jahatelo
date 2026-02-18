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
  } catch {
    // Si falla la DB en build, continuar sin las rutas dinámicas
  }

  return [...staticRoutes, ...motelRoutes];
}
