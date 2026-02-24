import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import MotelCard from '@/components/public/MotelCard';
import JsonLd from '@/components/JsonLd';
import { generateNeighborhoodCollectionSchema, generateBreadcrumbSchema } from '@/lib/seo';

type Props = {
  params: Promise<{ ciudad: string; barrio: string }>;
};

async function getNeighborhoodMotels(ciudad: string, barrio: string) {
  const normalizedCity = ciudad
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const normalizedNeighborhood = barrio
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const motels = await prisma.motel.findMany({
    where: {
      city: {
        equals: normalizedCity,
        mode: 'insensitive',
      },
      neighborhood: {
        equals: normalizedNeighborhood,
        mode: 'insensitive',
      },
      status: 'APPROVED',
      isActive: true,
    },
    include: {
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const motelsWithRatings = await Promise.all(
    motels.map(async (motel) => {
      const ratings = await prisma.review.aggregate({
        where: { motelId: motel.id },
        _avg: { score: true },
        _count: { score: true },
      });

      return {
        ...motel,
        ratingAvg: ratings._avg?.score,
        ratingCount: ratings._count?.score,
        thumbnail: motel.featuredPhoto || null,
      };
    })
  );

  return {
    motels: motelsWithRatings,
    cityName: normalizedCity,
    neighborhoodName: normalizedNeighborhood,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad, barrio } = await params;
  const { cityName, neighborhoodName, motels } = await getNeighborhoodMotels(ciudad, barrio);

  if (motels.length === 0) {
    return {
      title: 'Barrio no encontrado',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  const canonicalUrl = `${baseUrl}/ciudad/${ciudad.toLowerCase()}/${barrio.toLowerCase()}`;

  return {
    title: `Moteles en ${neighborhoodName}, ${cityName} | Jahatelo`,
    description: `Encuentra los mejores moteles en ${neighborhoodName}, ${cityName}, Paraguay. ${motels.length} opciones disponibles con habitaciones temáticas y las mejores comodidades.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Moteles en ${neighborhoodName}, ${cityName} | Jahatelo`,
      description: `${motels.length} moteles disponibles en ${neighborhoodName}`,
      url: canonicalUrl,
      siteName: 'Jahatelo',
      locale: 'es_PY',
      type: 'website',
    },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { ciudad, barrio } = await params;
  const { motels, cityName, neighborhoodName } = await getNeighborhoodMotels(ciudad, barrio);

  if (motels.length === 0) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  const collectionSchema = generateNeighborhoodCollectionSchema(
    cityName,
    neighborhoodName,
    motels.length
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', url: baseUrl },
    { name: 'Ciudades', url: `${baseUrl}/search` },
    { name: cityName, url: `${baseUrl}/ciudad/${ciudad.toLowerCase()}` },
    {
      name: neighborhoodName,
      url: `${baseUrl}/ciudad/${ciudad.toLowerCase()}/${barrio.toLowerCase()}`,
    },
  ]);

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-purple-600 transition-colors">
                  Inicio
                </a>
              </li>
              <li>/</li>
              <li>
                <a href="/search" className="hover:text-purple-600 transition-colors">
                  Ciudades
                </a>
              </li>
              <li>/</li>
              <li>
                <a
                  href={`/ciudad/${ciudad}`}
                  className="hover:text-purple-600 transition-colors"
                >
                  {cityName}
                </a>
              </li>
              <li>/</li>
              <li className="text-purple-600 font-medium">{neighborhoodName}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Moteles en {neighborhoodName}
            </h1>
            <p className="text-xl text-gray-700 mb-4">{cityName}, Paraguay</p>
            <p className="text-lg text-gray-600">
              {motels.length} {motels.length === 1 ? 'motel disponible' : 'moteles disponibles'}
            </p>
          </div>

          {/* Lista de moteles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {motels.map((motel) => (
              <MotelCard
                key={motel.id}
                motel={{
                  ...motel,
                  ratingAvg: motel.ratingAvg ?? 0,
                  ratingCount: motel.ratingCount ?? 0,
                  isFeatured: false,
                  featuredPhoto: motel.thumbnail,
                }}
              />
            ))}
          </div>

          {/* Link back to city */}
          <div className="mt-12 text-center">
            <a
              href={`/ciudad/${ciudad}`}
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Ver todos los moteles en {cityName}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const motels = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { not: undefined },
      neighborhood: { not: undefined },
    },
    select: {
      city: true,
      neighborhood: true,
    },
    distinct: ['city', 'neighborhood'],
  });

  return motels.map((m) => ({
    ciudad: m.city!.toLowerCase().replace(/\s+/g, '-'),
    barrio: m.neighborhood!.toLowerCase().replace(/\s+/g, '-'),
  }));
}
