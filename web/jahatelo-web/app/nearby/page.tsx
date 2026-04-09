import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import NearbyMotels from '@/components/public/NearbyMotels';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export const metadata = {
  title: 'Moteles Cerca Mío - Jahatelo',
  description: 'Encuentra los moteles más cercanos a tu ubicación actual',
  alternates: {
    canonical: `${BASE_URL}/nearby`,
  },
};

export default function NearbyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen section-bg">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#1e0a3c] via-[#2a0f52] to-[#3d1878] overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-glow-float" />
          <div className="navbar-gradient-border h-[2px] w-full absolute bottom-0 left-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900/50 border border-purple-700/50 rounded-full mb-5 animate-fade-up">
              <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-fade-up-delay-1">
              Moteles cerca mío
            </h1>
            <p className="text-lg text-purple-200/70 animate-fade-up-delay-2">
              Encontrá los moteles más cercanos a tu ubicación actual
            </p>
          </div>
        </div>

        {/* Nearby Motels Component */}
        <NearbyMotels />
      </div>
      <Footer />
    </>
  );
}
