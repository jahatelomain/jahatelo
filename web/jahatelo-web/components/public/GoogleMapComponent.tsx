'use client';

import { useEffect, useRef, useState } from 'react';
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

type GoogleMapComponentProps = {
  motels: MapMotel[];
  showRadius?: number; // radius in kilometers to show around user location
  initialUserLocation?: [number, number]; // initial user location to show
};

// Declare global google types
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function GoogleMapComponent({
  motels,
  showRadius,
  initialUserLocation
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    initialUserLocation || null
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('API key de Google Maps no configurada. Contacte al administrador.');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Error al cargar Google Maps');
    document.head.appendChild(script);

    return () => {
      // Cleanup: no removemos el script porque puede ser reutilizado
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    // Determine initial center
    let initialCenter = { lat: -25.2637, lng: -57.5759 }; // Asunción, Paraguay por defecto

    if (initialUserLocation) {
      initialCenter = { lat: initialUserLocation[0], lng: initialUserLocation[1] };
    } else if (motels.length > 0) {
      initialCenter = { lat: motels[0].latitude, lng: motels[0].longitude };
    }

    // Create map
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
      mapId: 'JAHATELO_MAP', // Required for advanced markers
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Add initial user location if provided
    if (initialUserLocation) {
      addUserMarker(initialUserLocation);
    }
  }, [isLoaded, motels, initialUserLocation]);

  // Add/update motel markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Custom purple pin SVG
    const purplePinSVG = `
      <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 29 16 29s16-17 16-29c0-8.837-7.163-16-16-16z" fill="#8E2DE2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;

    // Red pin for promos
    const redPinSVG = `
      <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 29 16 29s16-17 16-29c0-8.837-7.163-16-16-16z" fill="#EF4444"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;

    const purplePinIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(purplePinSVG)}`,
      scaledSize: new window.google.maps.Size(32, 45),
      anchor: new window.google.maps.Point(16, 45),
    };

    const redPinIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(redPinSVG)}`,
      scaledSize: new window.google.maps.Size(32, 45),
      anchor: new window.google.maps.Point(16, 45),
    };

    // Create markers for each motel
    motels.forEach((motel) => {
      const marker = new window.google.maps.Marker({
        position: { lat: motel.latitude, lng: motel.longitude },
        map: googleMapRef.current,
        title: motel.name,
        icon: motel.hasPromo ? redPinIcon : purplePinIcon,
      });

      // Create InfoWindow with custom content
      const infoWindowContent = `
        <div style="max-width: 280px; padding: 8px;">
          ${motel.featuredPhoto ? `
            <img
              src="${motel.featuredPhoto}"
              alt="${motel.name}"
              style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
            />
          ` : ''}
          <h3 style="font-weight: 700; font-size: 16px; color: #111827; margin: 0 0 4px 0;">
            ${motel.name}
          </h3>
          <p style="font-size: 13px; color: #6B7280; margin: 0 0 8px 0;">
            ${motel.neighborhood}, ${motel.city}
          </p>
          ${motel.hasPromo ? `
            <div style="display: inline-flex; align-items: center; gap: 4px; background: #FEE2E2; color: #DC2626; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 12px; margin-bottom: 12px;">
              ⭐ Promoción activa
            </div>
          ` : ''}
          <a
            href="/motels/${motel.slug}"
            style="display: block; width: 100%; text-align: center; background: #8E2DE2; color: white; font-weight: 600; padding: 10px 16px; border-radius: 8px; text-decoration: none; margin-top: 8px;"
          >
            Ver detalles
          </a>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        infoWindow.open(googleMapRef.current, marker);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  }, [isLoaded, motels]);

  // Add user marker
  const addUserMarker = (location: [number, number]) => {
    if (!googleMapRef.current || !window.google) return;

    // Remove existing user marker and circle
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Blue pin for user location
    const bluePinSVG = `
      <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 29 16 29s16-17 16-29c0-8.837-7.163-16-16-16z" fill="#3B82F6"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;

    const bluePinIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(bluePinSVG)}`,
      scaledSize: new window.google.maps.Size(32, 45),
      anchor: new window.google.maps.Point(16, 45),
    };

    const marker = new window.google.maps.Marker({
      position: { lat: location[0], lng: location[1] },
      map: googleMapRef.current,
      title: 'Tu ubicación',
      icon: bluePinIcon,
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: '<div style="padding: 8px;"><p style="font-weight: 600; color: #3B82F6; margin: 0;">Tu ubicación</p></div>',
    });

    marker.addListener('click', () => {
      infoWindow.open(googleMapRef.current, marker);
    });

    userMarkerRef.current = marker;

    // Add radius circle if specified
    if (showRadius) {
      const circle = new window.google.maps.Circle({
        map: googleMapRef.current,
        center: { lat: location[0], lng: location[1] },
        radius: showRadius * 1000, // km to meters
        strokeColor: '#9333ea',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#9333ea',
        fillOpacity: 0.15,
      });
      circleRef.current = circle;
    }

    // Center map on user location
    googleMapRef.current.setCenter({ lat: location[0], lng: location[1] });
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          addUserMarker(newLocation);
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

  if (error) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Inicializando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md border border-gray-200 font-medium flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Centrar en mí
      </button>

      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
