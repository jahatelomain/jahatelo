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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Mapa de Moteles
            </h1>
            <p className="text-gray-600">
              Explora todos los moteles disponibles en el mapa
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
