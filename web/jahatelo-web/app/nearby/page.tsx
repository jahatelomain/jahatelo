import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import NearbyMotels from '@/components/public/NearbyMotels';

export default function NearbyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b-4 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Moteles cerca mío
              </h1>
              <p className="text-lg text-gray-600">
                Encontrá los moteles más cercanos a tu ubicación actual
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Motels Component */}
        <NearbyMotels />
      </div>
      <Footer />
    </>
  );
}
