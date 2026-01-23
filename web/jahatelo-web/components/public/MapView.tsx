'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Google Maps
const GoogleMapComponent = dynamic(() => import('./GoogleMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Cargando mapa...</p>
      </div>
    </div>
  ),
});

type MapMotel = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  featuredPhoto: string | null;
  hasPromo: boolean;
  isFeatured: boolean;
  plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
};

export default function MapView() {
  const [motels, setMotels] = useState<MapMotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPromosOnly, setShowPromosOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const getPlanPriority = (plan?: MapMotel['plan']) => {
    switch (plan) {
      case 'DIAMOND':
        return 1;
      case 'GOLD':
        return 2;
      case 'BASIC':
        return 3;
      case 'FREE':
        return 4;
      default:
        return 4;
    }
  };

  useEffect(() => {
    async function fetchMapData() {
      try {
        const response = await fetch('/api/mobile/motels/map');
        const data = await response.json();

        if (data.success) {
          setMotels(data.motels);
        } else {
          setError(data.error || 'Error al cargar los datos');
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Error de conexión. Verifica tu internet.');
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el mapa</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (motels.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay moteles con ubicación</h3>
          <p className="text-gray-600">Actualmente no hay moteles con coordenadas disponibles para mostrar en el mapa.</p>
        </div>
      </div>
    );
  }

  const filteredMotels = motels
    .filter((motel) => {
      if (showPromosOnly && !motel.hasPromo) return false;
      if (showFeaturedOnly && !motel.isFeatured) return false;
      return true;
    })
    .sort((a, b) => {
      const planDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan);
      if (planDiff !== 0) return planDiff;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPromosOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
              showPromosOnly
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
            }`}
          >
            Solo promos
          </button>
          <button
            type="button"
            onClick={() => setShowFeaturedOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
              showFeaturedOnly
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
            }`}
          >
            Solo destacados
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-600" />
            Moteles
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            Tu ubicacion
          </span>
        </div>
      </div>

      {filteredMotels.length > 0 ? (
        <div className="flex-1">
          <GoogleMapComponent motels={filteredMotels} />
        </div>
      ) : (
        <div className="flex-1 w-full flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay moteles con esos filtros</h3>
            <p className="text-gray-600">Proba quitando algun filtro para ver mas resultados.</p>
          </div>
        </div>
      )}
    </div>
  );
}
