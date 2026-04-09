import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MapView from '@/components/public/MapView';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export const metadata = {
  title: 'Mapa de Moteles - Jahatelo',
  description: 'Encuentra moteles cerca de ti en el mapa interactivo',
  alternates: {
    canonical: `${BASE_URL}/mapa`,
  },
};

export default function MapaPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0f0520]">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0f0520] via-[#1a0a3c] to-[#2d1060] overflow-hidden">
          <div className="navbar-gradient-border h-[2px] w-full absolute bottom-0 left-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-900/40 border border-purple-700/50 px-4 py-1.5 rounded-full">
              Mapa interactivo
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              Mapa de Moteles
            </h1>
            <p className="text-purple-200/70">
              Explorá todos los moteles disponibles en el mapa
            </p>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[calc(100vh-200px)]">
          <MapView />
        </div>
      </div>
      <Footer />
    </>
  );
}
