import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import MotelCard from '@/components/public/MotelCard';
import JsonLd from '@/components/JsonLd';
import { generateCityCollectionSchema, generateBreadcrumbSchema } from '@/lib/seo';

type Props = {
  params: Promise<{ ciudad: string }>;
};

async function getCityMotels(ciudad: string) {
  const normalizedCity = ciudad
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const motels = await prisma.motel.findMany({
    where: {
      city: {
        equals: normalizedCity,
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

  return { motels: motelsWithRatings, cityName: normalizedCity };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params;
  const { cityName, motels } = await getCityMotels(ciudad);

  if (motels.length === 0) {
    return {
      title: 'Ciudad no encontrada',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  const canonicalUrl = `${baseUrl}/ciudad/${ciudad.toLowerCase()}`;

  return {
    title: `Moteles en ${cityName} | Jahatelo`,
    description: `Descubre los mejores moteles en ${cityName}, Paraguay. ${motels.length} opciones disponibles con habitaciones temáticas, jacuzzi y las mejores comodidades.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Moteles en ${cityName} | Jahatelo`,
      description: `${motels.length} moteles disponibles en ${cityName}`,
      url: canonicalUrl,
      siteName: 'Jahatelo',
      locale: 'es_PY',
      type: 'website',
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { ciudad } = await params;
  const { motels, cityName } = await getCityMotels(ciudad);

  if (motels.length === 0) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  const collectionSchema = generateCityCollectionSchema(cityName, motels.length);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', url: baseUrl },
    { name: 'Ciudades', url: `${baseUrl}/search` },
    { name: cityName, url: `${baseUrl}/ciudad/${ciudad.toLowerCase()}` },
  ]);

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Moteles en {cityName}
            </h1>
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
                  id: motel.id,
                  slug: motel.slug,
                  name: motel.name,
                  description: motel.description,
                  city: motel.city,
                  address: motel.address,
                  location: motel.latitude && motel.longitude ? { lat: motel.latitude, lng: motel.longitude } : null,
                  rating: { average: motel.ratingAvg ?? 0, count: motel.ratingCount ?? 0 },
                  isFeatured: motel.isFeatured,
                  hasPromo: false,
                  tienePromo: false,
                  startingPrice: null,
                  amenities: [],
                  thumbnail: motel.thumbnail,
                  featuredPhoto: motel.thumbnail,
                  promoImageUrl: null,
                  promoTitle: null,
                  promoDescription: null,
                  plan: motel.plan,
                  updatedAt: motel.updatedAt.toISOString(),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const cities = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { not: undefined },
    },
    select: { city: true },
    distinct: ['city'],
  });

  return cities
    .filter((m) => m.city)
    .map((m) => ({
      ciudad: m.city!.toLowerCase().replace(/\s+/g, '-'),
    }));
}
