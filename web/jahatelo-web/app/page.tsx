import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FeaturedCarousel from '@/components/public/FeaturedCarousel';
import CategoriesGrid from '@/components/public/CategoriesGrid';
import SocialLinks from '@/components/public/SocialLinks';
import SearchBar from '@/components/public/SearchBar';
import FeaturedMotels from '@/components/public/FeaturedMotels';
import RecentMotels from '@/components/public/RecentMotels';
import AdPopup from '@/components/public/AdPopup';
import PromoListWithAds from '@/components/public/PromoListWithAds';
import CityListWithAds from '@/components/public/CityListWithAds';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

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
    orderBy: [{ plan: 'desc' }, { createdAt: 'desc' }],
  });

  const promosMotels = promosMotelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const citiesResponse = await fetch(`${baseUrl}/api/mobile/cities`, {
    next: { revalidate: 60 },
  });
  const citiesPayload = citiesResponse.ok ? await citiesResponse.json() : { cities: [] };
  const cities = (citiesPayload.cities || [])
    .slice(0, 12)
    .map((item: { name: string; count: number }) => ({
      name: item.name,
      total: item.count,
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
    orderBy: [{ plan: 'desc' }, { createdAt: 'desc' }],
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
    orderBy: [{ plan: 'desc' }, { createdAt: 'desc' }],
  });

  const recentMotels = recentMotelsRaw.map((motel) => ({
    ...motel,
    photos: motel.photos.map((photo) => ({
      url: photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', href: '/ciudades', iconName: 'location-outline' },
    { id: 'map', label: 'Ver mapa', href: '/mapa', iconName: 'map-outline' },
    { id: 'promos', label: 'Promos', href: '/motels?promos=1', iconName: 'pricetag' },
  ];

  return (
    <>
      <AdPopup />
      <Navbar />
      <main data-testid="homepage-main">
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

            {featuredMotels.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <FeaturedCarousel featuredMotels={featuredMotels} />
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
        {cities.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Moteles por ciudad</h2>
                <Link href="/ciudades" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                  Ver todos
                </Link>
              </div>
              <CityListWithAds cities={cities} />
            </div>
          </section>
        )}
        {promosMotels.length > 0 && (
          <section className="py-12 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Promos activas</h2>
                <Link href="/motels?promos=1" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                  Ver todas
                </Link>
              </div>
              <PromoListWithAds motels={promosMotels} />
            </div>
          </section>
        )}
        {recentMotels.length > 0 && <RecentMotels motels={recentMotels} />}

        {featuredMotels.length === 0 && promosMotels.length === 0 && recentMotels.length === 0 && (
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
      </main>
      <Footer />
    </>
  );
}
