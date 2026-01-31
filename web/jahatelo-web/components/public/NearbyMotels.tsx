'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MotelCard from './MotelCard';

const GoogleMapComponent = dynamic(() => import('./GoogleMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Cargando mapa...</p>
    </div>
  ),
});

interface Motel {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  description: string | null;
  featuredPhoto: string | null;
  featuredPhotoWeb?: string | null;
  featuredPhotoApp?: string | null;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  distance?: number;
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

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
];

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

export default function NearbyMotels() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [allMotels, setAllMotels] = useState<Motel[]>([]);
  const [nearbyMotels, setNearbyMotels] = useState<Motel[]>([]);
  const [loading, setLoading] = useState(false);
  const [motelsLoading, setMotelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

  // Request user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('No pudimos obtener tu ubicación. Por favor, permite el acceso a tu ubicación.');
          setLocationPermission('denied');
          setLoading(false);
        }
      );
    } else {
      setError('Tu navegador no soporta geolocalización');
      setLocationPermission('denied');
      setLoading(false);
    }
  }, []);

  // Fetch all motels when user location is available
  useEffect(() => {
    if (userLocation) {
      const fetchMotels = async () => {
        try {
          setMotelsLoading(true);
          const response = await fetch('/api/motels/nearby');
          const data = await response.json();
          const sanitized = (data.motels || []).map((motel: Motel) => ({
            ...motel,
            photos: (motel.photos || []).map((photo) => ({
              url: photo.url,
              kind: photo.kind ?? 'OTHER',
            })),
          }));
          setAllMotels(sanitized);
        } catch (error) {
          console.error('Error fetching motels:', error);
          setError('Error al cargar los moteles');
        } finally {
          setMotelsLoading(false);
        }
      };

      fetchMotels();
    }
  }, [userLocation]);

  // Filter motels by radius when location, motels or radius changes
  useEffect(() => {
    if (userLocation && allMotels.length > 0) {
      const filtered = allMotels
        .map((motel) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            motel.latitude,
            motel.longitude
          );
          return { ...motel, distance };
        })
        .filter((motel) => motel.distance <= selectedRadius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyMotels(filtered);
    }
  }, [userLocation, allMotels, selectedRadius]);

  const handleRequestLocation = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('No pudimos obtener tu ubicación. Verifica los permisos del navegador.');
        setLoading(false);
      }
    );
  };

  if (locationPermission === 'pending' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Obteniendo tu ubicación...</p>
        </div>
      </div>
    );
  }

  if (locationPermission === 'denied' || error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ubicación no disponible
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'Necesitamos acceso a tu ubicación para mostrar moteles cercanos.'}
          </p>
          <button
            onClick={handleRequestLocation}
            className="inline-block px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-medium rounded-lg transition-colors"
          >
            Permitir acceso a ubicación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Radius Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Radio de búsqueda:
        </label>
        <div className="flex gap-3 flex-wrap">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedRadius === option.value
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {nearbyMotels.length} {nearbyMotels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          <span className="text-gray-600 font-normal"> dentro de {selectedRadius} km</span>
        </h2>
      </div>

      {/* Map */}
      <div className="mb-8 h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <GoogleMapComponent
          motels={nearbyMotels.map((motel) => ({
            id: motel.id,
            name: motel.name,
            slug: motel.slug,
            city: motel.city,
            neighborhood: motel.neighborhood,
            latitude: motel.latitude,
            longitude: motel.longitude,
            featuredPhoto: motel.featuredPhoto,
            hasPromo: false,
            plan: motel.plan ?? null,
          }))}
          showRadius={selectedRadius}
          initialUserLocation={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
        />
      </div>

      {/* Results Grid */}
      {motelsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`nearby-skeleton-${index}`}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse"
            >
              <div className="h-32 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : nearbyMotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyMotels.map((motel) => (
            <div key={motel.id} className="relative">
              <MotelCard motel={motel} />
              {motel.distance !== undefined && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                  <span className="text-sm font-semibold text-purple-600">
                    {motel.distance.toFixed(1)} km
                  </span>
                </div>
              )}
            </div>
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
            No hay moteles cercanos
          </h3>
          <p className="text-gray-600 mb-6">
            Intenta aumentar el radio de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
