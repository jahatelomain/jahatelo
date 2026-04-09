import type { Metadata } from 'next';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SearchResults from '@/components/public/SearchResults';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export const metadata: Metadata = {
  title: 'Buscar Moteles | Jahatelo',
  description: 'Buscá moteles por nombre, ciudad, barrio o características. Encontrá el lugar ideal con precios, fotos y promos actualizadas.',
  alternates: { canonical: `${BASE_URL}/search` },
  openGraph: {
    title: 'Buscar Moteles | Jahatelo',
    description: 'Buscá moteles por nombre, ciudad, barrio o características. Encontrá el lugar ideal con precios, fotos y promos actualizadas.',
    url: `${BASE_URL}/search`,
    type: 'website',
    siteName: 'Jahatelo',
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    amenities?: string;
    promos?: string;
    featured?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <div className="min-h-screen section-bg">
        {/* Hero Search Section */}
        <div className="relative bg-gradient-to-br from-[#1e0a3c] via-[#2a0f52] to-[#3d1878] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-glow-float" />
          <div className="navbar-gradient-border h-[2px] w-full absolute bottom-0 left-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-900/40 border border-purple-700/50 px-4 py-1.5 rounded-full animate-fade-up">
              Encontrá lo que buscás
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-fade-up-delay-1">
              Buscar Moteles
            </h1>
            <p className="text-lg text-purple-200/70 animate-fade-up-delay-2">
              Buscá por nombre, ciudad, barrio o características
            </p>
          </div>
        </div>

        {/* Search Results Component */}
        <SearchResults initialParams={params} />
      </div>
      <Footer />
    </>
  );
}
