import { Suspense } from 'react';
import Link from 'next/link';
import SectionWrapper from '@/components/public/SectionWrapper';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FeaturedCarousel from '@/components/public/FeaturedCarousel';
import CategoriesGrid from '@/components/public/CategoriesGrid';
import SocialLinks from '@/components/public/SocialLinks';
import SearchBar from '@/components/public/SearchBar';
import FeaturedMotels from '@/components/public/FeaturedMotels';
import AdPopup from '@/components/public/AdPopup';
import PromoListWithAds from '@/components/public/PromoListWithAds';
import CityListWithAds from '@/components/public/CityListWithAds';
import MobileHome from '@/components/public/MobileHome';
import HomeFeaturedProvider from '@/components/public/HomeFeaturedProvider';
import HomeBreadcrumbs from '@/components/public/HomeBreadcrumbs';
import {
  FeaturedCarouselSkeleton,
  CategoriesGridSkeleton,
  CityListSkeleton,
  PromoListSkeleton,
} from '@/components/public/HeroSkeletons';
import { headers } from 'next/headers';
import type { PublicMotelListResponse } from '@/lib/domain/motels/publicListItem';

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const [citiesResponse, featuredResponse, promosResponse] = await Promise.all([
    fetch(`${baseUrl}/api/mobile/cities`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}/api/mobile/motels?featured=true&limit=50`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/mobile/motels?promos=true&limit=50`, { cache: 'no-store' }),
  ]);
  const citiesPayload = citiesResponse.ok ? await citiesResponse.json() : { cities: [] };
  const cities = (citiesPayload.cities || [])
    .slice(0, 12)
    .map((item: { name: string; count: number }) => ({
      name: item.name,
      total: item.count,
    }));

  const featuredPayload: PublicMotelListResponse = featuredResponse.ok
    ? await featuredResponse.json()
    : { data: [], meta: { page: 1, limit: 50, total: 0, latestUpdatedAt: 0 } };
  const promosPayload: PublicMotelListResponse = promosResponse.ok
    ? await promosResponse.json()
    : { data: [], meta: { page: 1, limit: 50, total: 0, latestUpdatedAt: 0 } };
  const featuredMotels = [...featuredPayload.data];
  // The shared counter includes every checked motel, so both Web layouts must
  // load the same eligible set as the mobile app, not only page one.
  for (let page = 2; featuredMotels.length < featuredPayload.meta.total; page += 1) {
    const response = await fetch(`${baseUrl}/api/mobile/motels?featured=true&limit=50&page=${page}`, { cache: 'no-store' });
    if (!response.ok) break;
    const payload: PublicMotelListResponse = await response.json();
    if (!payload.data.length) break;
    featuredMotels.push(...payload.data);
  }
  const promosMotels = promosPayload.data;

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', href: '/search', iconName: 'location-outline' },
    { id: 'map', label: 'Ver mapa', href: '/mapa', iconName: 'map-outline' },
    { id: 'promos', label: 'Promos', href: '/search?promos=1', iconName: 'pricetag' },
  ];

  return (
    <HomeFeaturedProvider motelIds={featuredMotels.map((motel) => motel.id)}>
      <HomeBreadcrumbs />
      <AdPopup />
      <Navbar />
      <MobileHome featuredMotels={featuredMotels} cities={cities} />
      <main id="main-content" data-testid="homepage-main" className="hidden md:block">
        {/*
         * Hero desktop — alineado con brandguide/usage.txt:
         * "Keep backgrounds clean and white" y "Avoid extra borders or boxes behind the icon".
         * Se reemplazó el gradiente oscuro pesado y los glows decorativos por fondo blanco limpio
         * con acentos sutiles (borde inferior y sombra suave) para mantener jerarquía visual
         * sin romper la identidad de Jahatelo. Contraste WCAG AA preservado con textos oscuros.
         */}
        <section aria-labelledby="hero-heading" className="relative bg-white border-b border-gray-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Título */}
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="animate-fade-up inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-purple-700 bg-purple-50 px-4 py-1.5 rounded-full">
                La plataforma de moteles de Paraguay
              </span>
              <h1 id="hero-heading" className="animate-fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 leading-tight text-gray-900">
                <span className="animated-gradient-text">
                  Encontrá tu motel ideal
                </span>
              </h1>
            </div>

            {/* Buscador */}
            <div className="relative z-[70] animate-fade-up-delay-3 max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* Carousel y categorías sobre fondo blanco */}
        <div className="bg-white py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <Suspense fallback={<FeaturedCarouselSkeleton />}>
              <FeaturedCarousel featuredMotels={featuredMotels} />
            </Suspense>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<CategoriesGridSkeleton />}>
              <CategoriesGrid categories={categories} />
            </Suspense>
          </div>
        </div>

        {featuredMotels.length > 0 && <FeaturedMotels motels={featuredMotels.slice(0, 6)} />}
        {cities.length > 0 && (
          <SectionWrapper className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Suspense fallback={<CityListSkeleton />}>
                <div className="flex items-center gap-4 mb-8">
                 <div>
                 <p id="cities-heading" className="text-xs uppercase tracking-widest text-purple-400 mb-1">Explorá por zona</p>
                 <h2 aria-labelledby="cities-heading" className="text-2xl font-bold text-white">Moteles por ciudad</h2>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-700/60 to-transparent" />
                  <Link href="/search" className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors shrink-0">
                    Ver todos →
                  </Link>
                </div>
                <CityListWithAds cities={cities} />
              </Suspense>
            </div>
          </SectionWrapper>
        )}
        {promosMotels.length > 0 && (
          <SectionWrapper className="py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Suspense fallback={<PromoListSkeleton />}>
                <div className="flex items-center gap-4 mb-8">
                 <div>
                 <p id="promos-heading" className="text-xs uppercase tracking-widest text-pink-400 mb-1">Ofertas exclusivas</p>
                 <h2 aria-labelledby="promos-heading" className="text-2xl font-bold text-white">Promos activas</h2>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-pink-700/60 to-transparent" />
                  <Link href="/search?promos=1" className="text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors shrink-0">
                    Ver todas →
                  </Link>
                </div>
                <PromoListWithAds motels={promosMotels} />
              </Suspense>
            </div>
          </SectionWrapper>
        )}
        {featuredMotels.length === 0 && promosMotels.length === 0 && (
          <SectionWrapper className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-900/40 border border-purple-700/40 rounded-full mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Todavía no hay moteles publicados</h3>
              <p className="text-purple-200">Estamos trabajando para traerte los mejores moteles pronto.</p>
              <Link
                href="/registrar-motel"
                className="inline-block mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-900/40"
              >
                Registrar mi motel
              </Link>
            </div>
          </SectionWrapper>
        )}
        <section aria-labelledby="social-heading" className="bg-white border-b border-gray-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <h2 id="social-heading" className="sr-only">Redes sociales</h2>
         <SocialLinks />
          </div>
        </section>
      </main>
      <Footer />
    </HomeFeaturedProvider>
  );
}
