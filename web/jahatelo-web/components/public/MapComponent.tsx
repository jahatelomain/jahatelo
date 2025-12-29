'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import Link from 'next/link';

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

type MapComponentProps = {
  motels: MapMotel[];
  showRadius?: number; // radius in kilometers to show around user location
  initialUserLocation?: [number, number]; // initial user location to show
};

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to update map view when needed
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function MapComponent({ motels, showRadius, initialUserLocation }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(initialUserLocation || null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.6097, -74.0817]); // Bogotá por defecto
  const [iconsReady, setIconsReady] = useState(false);
  const [promoIcon, setPromoIcon] = useState<L.Icon | undefined>();
  const [userLocationIcon, setUserLocationIcon] = useState<L.Icon | undefined>();

  // Create icons only after component mounts on client
  useEffect(() => {
    if (typeof window !== 'undefined' && !iconsReady) {
      setPromoIcon(new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }));

      setUserLocationIcon(new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }));

      setIconsReady(true);
    }
  }, [iconsReady]);

  // Calculate center based on motels or use first motel
  const defaultCenter = useMemo(() => {
    if (motels.length === 0) return [4.6097, -74.0817] as [number, number];

    // Use first motel as center
    return [motels[0].latitude, motels[0].longitude] as [number, number];
  }, [motels]);

  useEffect(() => {
    // If user location is provided initially, center on it
    if (initialUserLocation) {
      setMapCenter(initialUserLocation);
    } else {
      setMapCenter(defaultCenter);
    }
  }, [defaultCenter, initialUserLocation]);

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter: [number, number] = [latitude, longitude];
          setUserLocation(newCenter);
          setMapCenter(newCenter);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No pudimos obtener tu ubicación. Verifica los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  // Don't render map until icons are ready to prevent errors
  if (!iconsReady) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Inicializando mapa...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md border border-gray-200 font-medium flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Centrar en mí
      </button>

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cluster markers */}
        <MarkerClusterGroup chunkedLoading>
          {motels.map((motel) => (
            <Marker
              key={motel.id}
              position={[motel.latitude, motel.longitude]}
              icon={motel.hasPromo ? promoIcon : undefined}
            >
            <Popup>
                <div className="min-w-[250px]">
                  {motel.featuredPhoto && (
                    <img
                      src={motel.featuredPhoto}
                      alt={motel.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{motel.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {motel.neighborhood}, {motel.city}
                  </p>
                  {motel.hasPromo && (
                    <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Promoción activa
                    </div>
                  )}
                  <Link
                    href={`/motels/${motel.slug}`}
                    className="block w-full text-center bg-purple-600 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Ver detalles
                  </Link>
                </div>
            </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={userLocation}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-blue-600">Tu ubicación</p>
                </div>
              </Popup>
            </Marker>

            {/* Radius circle if specified */}
            {showRadius && (
              <Circle
                center={userLocation}
                radius={showRadius * 1000} // convert km to meters
                pathOptions={{
                  color: '#9333ea',
                  fillColor: '#9333ea',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
