import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import CityListWithAds from '@/components/public/CityListWithAds';
import { headers } from 'next/headers';

export default async function CitiesPage() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const citiesResponse = await fetch(`${baseUrl}/api/mobile/cities`, {
    next: { revalidate: 60 },
  });
  const citiesPayload = citiesResponse.ok ? await citiesResponse.json() : { cities: [] };
  const cities = (citiesPayload.cities || []).map((item: { name: string; count: number }) => ({
    name: item.name,
    total: item.count,
  }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b-4 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7-7.5 11-7.5 11s-7.5-4-7.5-11a7.5 7.5 0 0115 0z" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Moteles por ciudad
              </h1>
              <p className="text-lg text-gray-600">
                Elegí una ciudad para ver los moteles disponibles
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {cities.length > 0 ? (
            <CityListWithAds cities={cities} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay ciudades disponibles</h3>
              <p className="text-gray-600">Todavía no hay moteles publicados para listar.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
