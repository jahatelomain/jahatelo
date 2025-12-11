import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MotelCard from '@/components/public/MotelCard';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
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

  return (
    <>
      <Navbar />
      <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-500 to-fuchsia-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Encontrá tu motel ideal en minutos
            </h1>
            <p className="text-lg md:text-xl text-purple-100 mb-8">
              La plataforma más completa para descubrir y comparar moteles.
              Información detallada, fotos, precios y reseñas reales.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-full shadow-xl p-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre, ciudad o barrio..."
                  className="flex-1 px-6 py-3 text-gray-900 placeholder-gray-400 focus:outline-none rounded-full"
                />
                <Link
                  href="/motels"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full transition-colors whitespace-nowrap"
                >
                  Ver moteles
                </Link>
              </div>
            </div>
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
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
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

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Búsqueda Fácil</h3>
              <p className="text-gray-600">
                Encuentra el motel perfecto filtrando por ubicación, precios y servicios.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fotos Reales</h3>
              <p className="text-gray-600">
                Ve fotos reales de las habitaciones, instalaciones y servicios de cada motel.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Precios Claros</h3>
              <p className="text-gray-600">
                Compara precios por hora, media jornada o noche completa de forma transparente.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </>
  );
}
