'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
}

interface MotelFiltersProps {
  cities: { city: string }[];
  neighborhoods: { neighborhood: string }[];
  amenities: Amenity[];
  currentCity?: string;
  currentNeighborhood?: string;
  currentSearch?: string;
  currentAmenities?: string[];
  currentPromos?: string;
}

export default function MotelFilters({
  cities,
  neighborhoods,
  amenities,
  currentCity,
  currentNeighborhood,
  currentSearch,
  currentAmenities = [],
  currentPromos,
}: MotelFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || '');
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(currentAmenities);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Auto-search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== currentSearch) {
      updateFilter('q', debouncedSearchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
      // If changing city, remove neighborhood
      if (key === 'city') {
        params.delete('neighborhood');
      }
    } else {
      params.delete(key);
      // If clearing city, also clear neighborhood
      if (key === 'city') {
        params.delete('neighborhood');
      }
    }

    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/search');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchValue);
  };

  const toggleAmenity = (amenityId: string) => {
    const newSelectedAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];

    setSelectedAmenities(newSelectedAmenities);

    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedAmenities.length > 0) {
      params.set('amenities', newSelectedAmenities.join(','));
    } else {
      params.delete('amenities');
    }
    router.push(`/search?${params.toString()}`);
  };

  const promosActive = currentPromos === '1';
  const hasFilters =
    currentCity ||
    currentNeighborhood ||
    currentSearch ||
    selectedAmenities.length > 0 ||
    promosActive;

  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 6);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar
        </label>
        <div className="relative">
          <input
            id="search"
            type="text"
            placeholder="Nombre, ciudad, barrio..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          La búsqueda se actualiza automáticamente
        </p>
      </div>

      {/* City Filter */}
      <div className="mb-6">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
          Ciudad
        </label>
        <select
          id="city"
          value={currentCity || ''}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </select>
      </div>

      {/* Neighborhood Filter */}
      {currentCity && neighborhoods.length > 0 && (
        <div className="mb-6">
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
            Barrio
          </label>
          <select
            id="neighborhood"
            value={currentNeighborhood || ''}
            onChange={(e) => updateFilter('neighborhood', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Todos los barrios</option>
            {neighborhoods.map((n) => (
              <option key={n.neighborhood} value={n.neighborhood}>
                {n.neighborhood}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amenities Filter */}
      {amenities.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amenidades
          </label>
          <div className="space-y-2">
            {displayedAmenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity.id)}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
                  {amenity.name}
                </span>
              </label>
            ))}
          </div>

          {amenities.length > 6 && (
            <button
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {showAllAmenities ? 'Ver menos' : `Ver todas (${amenities.length})`}
            </button>
          )}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Promos activas
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={promosActive}
            onChange={(event) => updateFilter('promos', event.target.checked ? '1' : '')}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
          />
          <span className="text-sm text-gray-700">Solo moteles con promos</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full px-4 py-2 text-sm text-purple-600 hover:text-purple-600 font-medium border border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
