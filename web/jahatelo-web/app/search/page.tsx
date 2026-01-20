import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import SearchResults from '@/components/public/SearchResults';

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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Search Section */}
        <div className="bg-white border-b-4 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">
              Encontrá tu motel ideal
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center">
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
