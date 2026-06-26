import Link from 'next/link';
import SectionWrapper from '@/components/public/SectionWrapper';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FeaturedCarousel from '@/components/public/FeaturedCarousel';
import { normalizeLocalUploadPath } from '@/lib/normalizeLocalUrl';
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
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const now = new Date();
  const promosMotelsRaw = await prisma.motel.findMany({
    where: {
      status: 'APPROVED',
      isActive: true,
      promos: {
        some: {
          isActive: true,
          isGlobal: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          ],
        },
      },
    },
    include: {
      photos: {
        orderBy: { order: 'asc' },
        take: 1,
      },
      promos: {
        where: {
          isActive: true,
          isGlobal: true,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
          ],
        },
      },
    },
    take: 5,
    orderBy: [{ plan: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }],
  });

  const promosMotels = promosMotelsRaw.map((motel) => ({
    id: motel.id,
    name: motel.name,
    slug: motel.slug,
    featuredPhoto: normalizeLocalUploadPath(motel.featuredPhoto),
    featuredPhotoWeb: normalizeLocalUploadPath(motel.featuredPhotoWeb),
    featuredPhotoApp: normalizeLocalUploadPath(motel.featuredPhotoApp),
    photos: motel.photos.map((photo) => ({
      url: normalizeLocalUploadPath(photo.url) || photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
    promos: motel.promos.map((promo) => ({
      id: promo.id,
      title: promo.title,
      description: promo.description ?? null,
      imageUrl: normalizeLocalUploadPath(promo.imageUrl),
      isActive: promo.isActive,
      validFrom: promo.validFrom ? promo.validFrom.toISOString() : null,
      validUntil: promo.validUntil ? promo.validUntil.toISOString() : null,
    })),
  }));

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
    take: 6,
    orderBy: [{ plan: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }],
  });

  const featuredMotels = featuredMotelsRaw.map((motel) => ({
    ...motel,
    featuredPhoto: normalizeLocalUploadPath(motel.featuredPhoto),
    featuredPhotoWeb: normalizeLocalUploadPath(motel.featuredPhotoWeb),
    featuredPhotoApp: normalizeLocalUploadPath(motel.featuredPhotoApp),
    photos: motel.photos.map((photo) => ({
      url: normalizeLocalUploadPath(photo.url) || photo.url,
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
    take: 6,
    orderBy: [{ plan: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }],
  });

  const recentMotels = recentMotelsRaw.map((motel) => ({
    ...motel,
    featuredPhoto: normalizeLocalUploadPath(motel.featuredPhoto),
    featuredPhotoWeb: normalizeLocalUploadPath(motel.featuredPhotoWeb),
    featuredPhotoApp: normalizeLocalUploadPath(motel.featuredPhotoApp),
    photos: motel.photos.map((photo) => ({
      url: normalizeLocalUploadPath(photo.url) || photo.url,
      kind: photo.kind ?? 'OTHER',
    })),
  }));

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', href: '/search', iconName: 'location-outline' },
    { id: 'map', label: 'Ver mapa', href: '/mapa', iconName: 'map-outline' },
    { id: 'promos', label: 'Promos', href: '/search?promos=1', iconName: 'pricetag' },
  ];

  return (
    <>
      <AdPopup />
      <Navbar />
      <main data-testid="homepage-main">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-[#0f0f1a] via-[#161624] to-[#1a1530] overflow-hidden">
          {/* Glow decorativo flotante */}
          <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-glow-float" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Partículas flotantes */}
          <div className="hero-particle w-2 h-2 top-[15%] left-[10%]" style={{animationDuration:'7s', animationDelay:'0s'}} />
          <div className="hero-particle w-1.5 h-1.5 top-[30%] left-[20%]" style={{animationDuration:'9s', animationDelay:'1.5s', background:'rgba(245,101,101,0.45)'}} />
          <div className="hero-particle w-2.5 h-2.5 top-[20%] right-[15%]" style={{animationDuration:'8s', animationDelay:'0.8s'}} />
          <div className="hero-particle w-1.5 h-1.5 top-[55%] right-[10%]" style={{animationDuration:'6s', animationDelay:'2s', background:'rgba(213,63,140,0.4)'}} />
          <div className="hero-particle w-2 h-2 top-[70%] left-[15%]" style={{animationDuration:'10s', animationDelay:'0.3s'}} />
          <div className="hero-particle w-1 h-1 top-[45%] left-[35%]" style={{animationDuration:'8.5s', animationDelay:'3s', background:'rgba(245,101,101,0.35)'}} />
          <div className="hero-particle w-3 h-3 top-[10%] right-[30%]" style={{animationDuration:'11s', animationDelay:'1s', background:'rgba(168,85,247,0.3)'}} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Título */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="animate-fade-up inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-900/40 border border-purple-700/50 px-4 py-1.5 rounded-full">
                La plataforma de moteles de Paraguay
              </span>
              <h1 className="animate-fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 leading-tight">
                <span className="animated-gradient-text">
                  Encontrá tu motel ideal
                </span>
              </h1>
            </div>

            {/* Buscador */}
            <div className="animate-fade-up-delay-3 max-w-2xl mx-auto mb-12">
              <SearchBar />
            </div>

            {/* Carousel destacados */}
            {featuredMotels.length > 0 && (
              <div className="animate-fade-up-delay-4 max-w-5xl mx-auto mb-12">
                <FeaturedCarousel featuredMotels={featuredMotels} />
              </div>
            )}

            {/* Cards de categorías */}
            <div className="max-w-5xl mx-auto">
              <CategoriesGrid categories={categories} />
            </div>
          </div>
        </section>

        {/* Redes sociales */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <SocialLinks />
          </div>
        </section>

        {featuredMotels.length > 0 && <FeaturedMotels motels={featuredMotels} />}
        {cities.length > 0 && (
          <SectionWrapper className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">Explorá por zona</p>
                  <h2 className="text-2xl font-bold text-white">Moteles por ciudad</h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-700/60 to-transparent" />
                <Link href="/search" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors shrink-0">
                  Ver todos →
                </Link>
              </div>
              <CityListWithAds cities={cities} />
            </div>
          </SectionWrapper>
        )}
        {promosMotels.length > 0 && (
          <SectionWrapper className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-pink-400 mb-1">Ofertas exclusivas</p>
                  <h2 className="text-2xl font-bold text-white">Promos activas</h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-pink-700/60 to-transparent" />
                <Link href="/search?promos=1" className="text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors shrink-0">
                  Ver todas →
                </Link>
              </div>
              <PromoListWithAds motels={promosMotels} />
            </div>
          </SectionWrapper>
        )}
        {recentMotels.length > 0 && <RecentMotels motels={recentMotels} />}

        {featuredMotels.length === 0 && promosMotels.length === 0 && recentMotels.length === 0 && (
          <SectionWrapper className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-900/40 border border-purple-700/40 rounded-full mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Todavía no hay moteles publicados</h3>
              <p className="text-purple-300/70">Estamos trabajando para traerte los mejores moteles pronto.</p>
              <Link
                href="/registrar-motel"
                className="inline-block mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-900/40"
              >
                Registrar mi motel
              </Link>
            </div>
          </SectionWrapper>
        )}
      </main>
      <Footer />
    </>
  );
}
