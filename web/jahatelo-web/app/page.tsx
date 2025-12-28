import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MotelCard from '@/components/public/MotelCard';
import PromoCarousel from '@/components/public/PromoCarousel';
import CategoriesGrid from '@/components/public/CategoriesGrid';
import SocialLinks from '@/components/public/SocialLinks';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  // Get motels with active promos
  const promosMotels = await prisma.motel.findMany({
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

  // Get featured motels or any active approved motels
  const featuredMotels = await prisma.motel.findMany({
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

  // If no featured motels, get any approved active motels
  const motelsToShow = featuredMotels.length > 0
    ? featuredMotels
    : await prisma.motel.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
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

  // Categories for navigation
  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', href: '/motels', iconName: 'location-outline' },
    { id: 'map', label: 'Ver mapa', href: '/mapa', iconName: 'map-outline' },
    { id: 'popular', label: 'Populares', href: '/motels', iconName: 'flame-outline' },
  ];

  return (
    <>
      <Navbar />
      <div>
      {/* Hero Section */}
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

          {/* Promo Carousel */}
          {promosMotels.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <PromoCarousel promos={promosMotels} />
            </div>
          )}

          {/* Categories Grid */}
          <div className="max-w-4xl mx-auto mt-8">
            <CategoriesGrid categories={categories} />
          </div>

          {/* Social Links */}
          <div className="max-w-4xl mx-auto mt-6">
            <SocialLinks />
          </div>
        </div>
      </section>

      {/* Featured Motels Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {featuredMotels.length > 0 ? 'Moteles Destacados' : 'Moteles Disponibles'}
            </h2>
            <p className="text-lg text-gray-600">
              Descubrí los mejores moteles con toda la información que necesitás
            </p>
          </div>

          {motelsToShow.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {motelsToShow.map((motel) => (
                  <MotelCard key={motel.id} motel={motel} />
                ))}
              </div>

              <div className="text-center">
                <Link
                  href="/motels"
                  className="inline-block border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Ver todos los moteles
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Todavía no hay moteles publicados
              </h3>
              <p className="text-gray-600">
                Estamos trabajando para traerte los mejores moteles pronto.
              </p>
            </div>
          )}
        </div>
      </section>

      </div>
      <Footer />
    </>
  );
}
