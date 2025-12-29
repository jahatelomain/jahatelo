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
};

export default function MapView() {
  const [motels, setMotels] = useState<MapMotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return <GoogleMapComponent motels={motels} />;
}
