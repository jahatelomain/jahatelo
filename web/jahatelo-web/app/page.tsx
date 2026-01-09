import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import PromoCarousel from '@/components/public/PromoCarousel';
import CategoriesGrid from '@/components/public/CategoriesGrid';
import SocialLinks from '@/components/public/SocialLinks';
import SearchBar from '@/components/public/SearchBar';
import FeaturedMotels from '@/components/public/FeaturedMotels';
import PopularMotels from '@/components/public/PopularMotels';
import RecentMotels from '@/components/public/RecentMotels';
import AdPopup from '@/components/public/AdPopup';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const promosMotelsRaw = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      promos: {
        some: {
          isActive: true,
        },
      },
    },
    include: {
      photos: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const promosMotels = promosMotelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const featuredMotelsRaw = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      isFeatured: true,
    },
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
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const featuredMotels = featuredMotelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analyticsTop = await prisma.motelAnalytics.groupBy({
    by: ['motelId'],
    where: {
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        _all: 'desc',
      },
    },
    take: 6,
  });

  const popularMotelsRaw = analyticsTop.length > 0
    ? await prisma.motel.findMany({
        where: {
          id: { in: analyticsTop.map((item) => item.motelId) },
          status: 'APPROVED',
          isActive: true,
        },
        include: {
          photos: { orderBy: { order: 'asc' }, take: 1 },
          motelAmenities: { take: 3, include: { amenity: true } },
          rooms: {
            where: { isActive: true },
            select: { price1h: true, price2h: true, price12h: true },
          },
        },
      })
    : [];

  const popularMotels = analyticsTop.length > 0
    ? analyticsTop
        .map((item) => popularMotelsRaw.find((motel) => motel.id === item.motelId))
        .filter(Boolean)
        .map((motel: any) => ({
          ...motel,
          photos: motel.photos.map((photo: any) => ({
            url: photo.url,
            kind: photo.kind ?? 'OTHER',
          })),
        }))
    : [];

  const recentMotelsRaw = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      photos: { orderBy: { order: 'asc' }, take: 1 },
      motelAmenities: { take: 3, include: { amenity: true } },
      rooms: {
        where: { isActive: true },
        select: { price1h: true, price2h: true, price12h: true },
      },
    },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const recentMotels = recentMotelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', href: '/motels', iconName: 'location-outline' },
    { id: 'map', label: 'Ver mapa', href: '/mapa', iconName: 'map-outline' },
    { id: 'popular', label: 'Populares', href: '/motels', iconName: 'flame-outline' },
  ];

  return (
    <>
      <AdPopup />
      <Navbar />
      <div>
        <section className="bg-white border-b-4 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900">
                Encontrá tu motel ideal
              </h1>
              <p className="text-lg md:text-xl text-gray-600">
                La plataforma más completa para descubrir y comparar moteles
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar />
            </div>

            {promosMotels.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <PromoCarousel promos={promosMotels} />
              </div>
            )}

            <div className="max-w-4xl mx-auto mt-8">
              <CategoriesGrid categories={categories} />
            </div>

            <div className="max-w-4xl mx-auto mt-6">
              <SocialLinks />
            </div>
          </div>
        </section>

        {featuredMotels.length > 0 && <FeaturedMotels motels={featuredMotels} />}
        {popularMotels.length > 0 && <PopularMotels motels={popularMotels} />}
        {recentMotels.length > 0 && <RecentMotels motels={recentMotels} />}

        {featuredMotels.length === 0 && popularMotels.length === 0 && recentMotels.length === 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Todavía no hay moteles publicados</h3>
              <p className="text-gray-600">Estamos trabajando para traerte los mejores moteles pronto.</p>
              <Link
                href="/registrar-motel"
                className="inline-block mt-6 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Registrar mi motel
              </Link>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
