'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface MotelFiltersProps {
  cities: { city: string }[];
  neighborhoods: { neighborhood: string }[];
  currentCity?: string;
  currentNeighborhood?: string;
  currentSearch?: string;
}

export default function MotelFilters({
  cities,
  neighborhoods,
  currentCity,
  currentNeighborhood,
  currentSearch,
}: MotelFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || '');

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

    router.push(`/motels?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/motels');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchValue);
  };

  const hasFilters = currentCity || currentNeighborhood || currentSearch;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar
        </label>
        <div className="flex gap-2">
          <input
            id="search"
            type="text"
            placeholder="Nombre o descripción..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* City Filter */}
      <div className="mb-6">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
          Ciudad
        </label>
        <select
          id="city"
          value={currentCity || ''}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
