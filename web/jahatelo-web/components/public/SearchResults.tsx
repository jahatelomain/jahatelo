'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import MotelCard from './MotelCard';

interface SearchResultsProps {
  initialParams: {
    q?: string;
    city?: string;
    amenities?: string;
    promos?: string;
    featured?: string;
  };
}

interface Motel {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  description: string | null;
  featuredPhoto: string | null;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  photos: Array<{ url: string; kind: string }>;
  motelAmenities: Array<{
    amenity: {
      id: string;
      name: string;
      icon: string | null;
    };
  }>;
  rooms: Array<{
    price1h: number | null;
    price2h: number | null;
    price12h: number | null;
  }>;
  plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
}

const popularSearches = [
  'Jacuzzi',
  'Asunción',
  'Fernando de la Mora',
  'Garage privado',
  'Wi-Fi',
  'Netflix',
];

export default function SearchResults({ initialParams }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialParams.q || '');
  const [motels, setMotels] = useState<Motel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialParams.city || '');
  const [onlyPromos, setOnlyPromos] = useState(initialParams.promos === '1');
  const [onlyFeatured, setOnlyFeatured] = useState(initialParams.featured === '1');
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const fetchCities = async () => {
      setCitiesLoading(true);
      try {
        const response = await fetch('/api/motels');
        const data = await response.json();
        const cityList = (data || [])
          .map((motel: { city?: string | null }) => motel.city)
          .filter((city): city is string => Boolean(city && city.trim().length > 0));

        const uniqueCities = Array.from(new Set(cityList)).sort((a, b) => a.localeCompare(b));
        setCities(uniqueCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Fetch motels when search params change
  useEffect(() => {
    const fetchMotels = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
        if (selectedCity) params.set('city', selectedCity);
        if (onlyPromos) params.set('promos', '1');
        if (onlyFeatured) params.set('featured', '1');

        const response = await fetch(`/api/motels/search?${params.toString()}`);
        const data = await response.json();
        // Sanitize photos to ensure kind is always a string
        const sanitized = (data.motels || []).map((motel: Motel) => ({
          ...motel,
          photos: (motel.photos || []).map((photo) => ({
            url: photo.url,
            kind: photo.kind ?? 'OTHER',
          })),
        }));
        setMotels(sanitized);
      } catch (error) {
        console.error('Error fetching motels:', error);
        setMotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMotels();
  }, [debouncedSearchQuery, selectedCity, onlyPromos, onlyFeatured]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchQuery) {
      params.set('q', debouncedSearchQuery);
    } else {
      params.delete('q');
    }
    if (selectedCity) {
      params.set('city', selectedCity);
    } else {
      params.delete('city');
    }
    if (onlyPromos) {
      params.set('promos', '1');
    } else {
      params.delete('promos');
    }
    if (onlyFeatured) {
      params.set('featured', '1');
    } else {
      params.delete('featured');
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedCity, onlyPromos, onlyFeatured]);

  const handlePopularSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCity('');
    setOnlyPromos(false);
    setOnlyFeatured(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Buscar moteles por nombre, ciudad, amenidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pr-12 text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
            >
              <option value="">
                {citiesLoading ? 'Cargando ciudades...' : 'Todas las ciudades'}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 md:pt-7">
            <button
              type="button"
              onClick={() => setOnlyPromos((prev) => !prev)}
              className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                onlyPromos
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              Solo promos
            </button>
            <button
              type="button"
              onClick={() => setOnlyFeatured((prev) => !prev)}
              className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                onlyFeatured
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              Solo destacados
            </button>
          </div>
        </div>
      </div>

      {/* Popular Searches */}
      {!searchQuery && !selectedCity && !onlyPromos && !onlyFeatured && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Búsquedas populares:</h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <button
                key={search}
                onClick={() => handlePopularSearch(search)}
                className="px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm font-medium"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(searchQuery || selectedCity || onlyPromos || onlyFeatured) && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
          {searchQuery && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span>"{searchQuery}"</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-purple-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {selectedCity && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span>{selectedCity}</span>
              <button onClick={() => setSelectedCity('')} className="hover:text-purple-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {onlyPromos && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span>Promos</span>
              <button onClick={() => setOnlyPromos(false)} className="hover:text-purple-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {onlyFeatured && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <span>Destacados</span>
              <button onClick={() => setOnlyFeatured(false)} className="hover:text-purple-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={clearSearch}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Buscando moteles...</p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {/* Results Count */}
          {(searchQuery || selectedCity) && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {motels.length} {motels.length === 1 ? 'resultado' : 'resultados'}
              </h2>
            </div>
          )}

          {/* Motels Grid */}
          {motels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {motels.map((motel) => (
                <MotelCard key={motel.id} motel={motel} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || selectedCity ? 'No se encontraron resultados' : 'Iniciá una búsqueda'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCity
                  ? 'Intenta con otros términos o filtros'
                  : 'Usá la barra de búsqueda o seleccioná una búsqueda popular'}
              </p>
              {(searchQuery || selectedCity) && (
                <button
                  onClick={clearSearch}
                  className="inline-block px-6 py-2 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-medium rounded-lg transition-colors"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
