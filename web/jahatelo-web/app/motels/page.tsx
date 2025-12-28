import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MotelCard from '@/components/public/MotelCard';
import MotelFilters from '@/components/public/MotelFilters';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface MotelsPageProps {
  searchParams: Promise<{
    city?: string;
    neighborhood?: string;
    search?: string;
    amenities?: string;
  }>;
}

export default async function MotelsPage({ searchParams }: MotelsPageProps) {
  const params = await searchParams;
  const { city, neighborhood, search, amenities } = params;
  const amenityIds = amenities ? amenities.split(',') : [];

  // Build where clause based on filters
  const whereClause: Prisma.MotelWhereInput = {
    status: 'APPROVED',
    isActive: true,
  };

  if (city) {
    whereClause.city = { contains: city };
  }

  if (neighborhood) {
    whereClause.neighborhood = { contains: neighborhood };
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { city: { contains: search } },
      { neighborhood: { contains: search } },
    ];
  }

  if (amenityIds.length > 0) {
    whereClause.motelAmenities = {
      some: {
        amenityId: {
          in: amenityIds,
        },
      },
    };
  }

  // Fetch motels
  const motelsRaw = await prisma.motel.findMany({
    where: whereClause,
    include: {
      photos: {
        orderBy: { order: 'asc' },
        take: 1,
      },
      motelAmenities: {
        take: 3,
        include: {
          amenity: true,
        },
      },
      rooms: {
        where: { isActive: true },
        select: {
          price1h: true,
          price2h: true,
          price12h: true,
        },
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { ratingAvg: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Sanitize photos to ensure kind is always a string
  const motels = motelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  // Get unique cities for filter
  const cities = await prisma.motel.findMany({
    where: { status: 'APPROVED', isActive: true },
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  });

  // Get neighborhoods for selected city
  const neighborhoods = city
    ? await prisma.motel.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          city: { contains: city },
        },
        select: { neighborhood: true },
        distinct: ['neighborhood'],
        orderBy: { neighborhood: 'asc' },
      })
    : [];

  // Get all amenities for filter
  const allAmenities = await prisma.amenity.findMany({
    where: {
      OR: [
        { type: 'MOTEL' },
        { type: 'BOTH' },
      ],
    },
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Moteles
          </h1>
          <p className="text-gray-600">
            {motels.length} {motels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <MotelFilters
              cities={cities}
              neighborhoods={neighborhoods}
              amenities={allAmenities}
              currentCity={city}
              currentNeighborhood={neighborhood}
              currentSearch={search}
              currentAmenities={amenityIds}
            />
          </div>

          {/* Motels Grid */}
          <div className="lg:col-span-3">
            {motels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {motels.map((motel) => (
                  <MotelCard key={motel.id} motel={motel} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron moteles
                </h3>
                <p className="text-gray-600 mb-4">
                  Intenta ajustar los filtros para encontrar lo que buscas.
                </p>
                {(city || neighborhood || search) && (
                  <button
                    onClick={() => {
                      window.location.href = '/motels';
                    }}
                    className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Ver todos los moteles
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
