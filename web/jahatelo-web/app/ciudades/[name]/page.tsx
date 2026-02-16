import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MotelListWithAds from '@/components/public/MotelListWithAds';
import { prisma } from '@/lib/prisma';
import { normalizeLocalUploadPath } from '@/lib/normalizeLocalUrl';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function CityMotelsPage({ params }: Props) {
  const { name } = await params;
  const cityName = decodeURIComponent(name);

  const motelsRaw = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      city: { contains: cityName, mode: 'insensitive' },
    },
    include: {
      photos: { orderBy: { order: 'asc' }, take: 1 },
      rooms: {
        where: { isActive: true },
        select: {
          price1h: true,
          price2h: true,
          price12h: true,
          amenities: {
            select: { amenity: { select: { id: true, name: true, icon: true } } },
          },
        },
      },
    },
    orderBy: [{ plan: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }],
  });

  const motels = motelsRaw.map((motel) => ({
    ...motel,
    featuredPhoto: normalizeLocalUploadPath(motel.featuredPhoto),
    featuredPhotoWeb: normalizeLocalUploadPath(motel.featuredPhotoWeb),
    featuredPhotoApp: normalizeLocalUploadPath(motel.featuredPhotoApp),
    photos: motel.photos.map((photo) => ({
      url: normalizeLocalUploadPath(photo.url) || photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b-4 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <Link
                href="/ciudades"
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block"
              >
                ← Todas las ciudades
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Moteles en {cityName}
              </h1>
              <p className="text-lg text-gray-600">
                {motels.length}{' '}
                {motels.length === 1 ? 'motel disponible' : 'moteles disponibles'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {motels.length > 0 ? (
            <MotelListWithAds motels={motels} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay moteles en {cityName}
              </h3>
              <p className="text-gray-600">
                Todavía no hay moteles publicados en esta ciudad.
              </p>
              <Link
                href="/ciudades"
                className="inline-block mt-6 text-purple-600 hover:text-purple-700 font-semibold"
              >
                Ver otras ciudades
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
