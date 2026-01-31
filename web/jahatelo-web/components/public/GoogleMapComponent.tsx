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
  featuredPhotoWeb?: string | null;
  featuredPhotoApp?: string | null;
  hasPromo: boolean;
  isFeatured?: boolean;
  plan?: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
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
  const overlaysRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const userLabelRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    initialUserLocation || null
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const scriptId = 'google-maps-js';

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
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Error al cargar Google Maps');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'jahatelo-pin-animations';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes jahatelo-pin-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
    `;
    document.head.appendChild(style);
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
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const BASE_PIN_WIDTH = 32;
    const BASE_PIN_HEIGHT = 45;
    const BASE_PIN_CENTER = 16;
    const BASE_PIN_RADIUS = 13;

    const getPlanZIndex = (plan?: MapMotel['plan']) => {
      switch (plan) {
        case 'DIAMOND':
          return 400;
        case 'GOLD':
          return 300;
        case 'BASIC':
          return 200;
        case 'FREE':
          return 100;
        default:
          return 200;
      }
    };

    const getPlanConfig = (plan?: MapMotel['plan']) => {
      switch (plan) {
        case 'FREE':
          return { color: '#9CA3AF', labelColor: '#9CA3AF', opacity: 1, scale: 1, badge: null, glow: null };
        case 'GOLD':
          return { color: '#F59E0B', labelColor: '#F59E0B', opacity: 1, scale: 1.15, badge: '★', glow: null };
        case 'DIAMOND':
          return { color: '#22D3EE', labelColor: '#22D3EE', opacity: 1, scale: 1.3, badge: '◆', glow: 'rgba(34, 211, 238, 0.55)' };
        default:
          return { color: '#8E2DE2', labelColor: '#8E2DE2', opacity: 1, scale: 1, badge: null, glow: null };
      }
    };

    const createPinSvg = (color: string, opacity: number) => `
      <svg width="${BASE_PIN_WIDTH}" height="${BASE_PIN_HEIGHT}" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${BASE_PIN_CENTER}" cy="${BASE_PIN_CENTER}" r="${BASE_PIN_RADIUS}" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="3"/>
        <path d="M16 20.5C16 20.5 11.5 17.5 11.5 14.5C11.5 12.5 13 11 14.5 11C15.5 11 16 11.5 16 11.5C16 11.5 16.5 11 17.5 11C19 11 20.5 12.5 20.5 14.5C20.5 17.5 16 20.5 16 20.5Z" fill="white"/>
      </svg>
    `;

    // Red pin with heart for user location ONLY
    const redPinSVG = `
      <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" fill="#EF4444" stroke="white" stroke-width="3"/>
        <path d="M16 20.5C16 20.5 11.5 17.5 11.5 14.5C11.5 12.5 13 11 14.5 11C15.5 11 16 11.5 16 11.5C16 11.5 16.5 11 17.5 11C19 11 20.5 12.5 20.5 14.5C20.5 17.5 16 20.5 16 20.5Z" fill="white"/>
      </svg>
    `;

    const redPinIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(redPinSVG)}`,
      scaledSize: new window.google.maps.Size(32, 45),
      anchor: new window.google.maps.Point(16, 45),
      labelOrigin: new window.google.maps.Point(16, -14),
    };

    // Create markers for each motel
    motels.forEach((motel) => {
      const planConfig = getPlanConfig(motel.plan ?? null);
      const planZIndex = getPlanZIndex(motel.plan ?? null);
      const pinSvg = createPinSvg(planConfig.color, planConfig.opacity);
      const pinWidth = Math.round(BASE_PIN_WIDTH * planConfig.scale);
      const pinHeight = Math.round(BASE_PIN_HEIGHT * planConfig.scale);
      const pinIcon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
        scaledSize: new window.google.maps.Size(pinWidth, pinHeight),
        anchor: new window.google.maps.Point(pinWidth / 2, pinHeight),
      };
      const marker = new window.google.maps.Marker({
        position: { lat: motel.latitude, lng: motel.longitude },
        map: googleMapRef.current,
        icon: pinIcon,
        zIndex: planZIndex,
        // NO usamos label para evitar tooltip nativo
      });

      // Crear etiqueta HTML personalizada como overlay
      class CustomLabel extends window.google.maps.OverlayView {
        position: any;
        text: string;
        div: HTMLDivElement | null = null;

        constructor(position: any, text: string) {
          super();
          this.position = position;
          this.text = text;
        }

        onAdd() {
          this.div = document.createElement('div');
          this.div.style.position = 'absolute';
          this.div.style.background = planConfig.labelColor;
          this.div.style.color = '#FFFFFF';
          this.div.style.padding = `${Math.round(6 * planConfig.scale)}px ${Math.round(12 * planConfig.scale)}px`;
          this.div.style.borderRadius = `${Math.round(10 * planConfig.scale)}px`;
          this.div.style.border = '2px solid #FFFFFF';
          this.div.style.fontSize = `${Math.round(13 * planConfig.scale)}px`;
          this.div.style.fontWeight = '500';
          this.div.style.whiteSpace = 'nowrap';
          this.div.style.cursor = 'pointer';
          this.div.style.zIndex = String(planZIndex + 10);
          this.div.style.boxShadow = planConfig.glow
            ? `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 14px ${planConfig.glow}`
            : '0 2px 8px rgba(0, 0, 0, 0.15)';
          this.div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          this.div.style.position = 'absolute';
          this.div.style.maxWidth = `${Math.round(180 * planConfig.scale)}px`;
          this.div.style.overflow = 'visible';
          this.div.textContent = this.text;
          this.div.style.pointerEvents = 'auto';
          if (planConfig.badge) {
            this.div.style.animation = 'jahatelo-pin-bounce 1.6s ease-in-out infinite';
          }

          if (planConfig.badge) {
            const badge = document.createElement('div');
            badge.textContent = planConfig.badge;
            badge.style.position = 'absolute';
            badge.style.top = `${Math.round(-6 * planConfig.scale)}px`;
            badge.style.right = `${Math.round(-6 * planConfig.scale)}px`;
            badge.style.width = `${Math.round(18 * planConfig.scale)}px`;
            badge.style.height = `${Math.round(18 * planConfig.scale)}px`;
            badge.style.borderRadius = '999px';
            badge.style.background = '#FFFFFF';
            badge.style.border = `2px solid ${planConfig.color}`;
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.fontSize = `${Math.round(10 * planConfig.scale)}px`;
            badge.style.fontWeight = '700';
            badge.style.color = planConfig.color;
            if (planConfig.glow) {
              badge.style.boxShadow = `0 0 10px ${planConfig.glow}`;
            }
            this.div.appendChild(badge);
          }

          // Click en la etiqueta también abre el InfoWindow
          this.div.addEventListener('click', () => {
            markersRef.current.forEach(m => {
              if (m.infoWindow) m.infoWindow.close();
            });
            marker.infoWindow.open(googleMapRef.current, marker);
          });

          const panes = this.getPanes();
          panes.overlayLayer.appendChild(this.div);
        }

        draw() {
          if (!this.div) return;
          const overlayProjection = this.getProjection();
          const position = overlayProjection.fromLatLngToDivPixel(
            new window.google.maps.LatLng(this.position.lat, this.position.lng)
          );
          this.div.style.left = position.x - (this.div.offsetWidth / 2) + 'px';
          const labelOffset = Math.round((BASE_PIN_HEIGHT * planConfig.scale) + (22 * planConfig.scale));
          this.div.style.top = position.y - labelOffset + 'px';
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode?.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const customLabel = new CustomLabel(
        { lat: motel.latitude, lng: motel.longitude },
        motel.name
      );
      customLabel.setMap(googleMapRef.current);
      overlaysRef.current.push(customLabel);

      const isFreePlan = motel.plan === 'FREE';
      const actionButtonColor = planConfig.labelColor;
      const actionButton = isFreePlan
        ? `
          <div
            style="display: block; width: 100%; text-align: center; background: #E5E7EB; color: #6B7280; font-weight: 600; padding: 10px 16px; border-radius: 8px; margin-top: 8px;"
          >
            No disponible
          </div>
        `
        : `
          <a
            href="/motels/${motel.slug}"
            style="display: block; width: 100%; text-align: center; background: ${actionButtonColor}; color: white; font-weight: 600; padding: 10px 16px; border-radius: 8px; text-decoration: none; margin-top: 8px;"
          >
            Ver detalles
          </a>
        `;

      const motelPhoto = motel.featuredPhotoWeb || motel.featuredPhoto;

      // Create InfoWindow with custom content
      const infoWindowContent = `
        <div style="max-width: 280px; padding: 8px;">
          ${motelPhoto ? `
            <img
              src="${motelPhoto}"
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
          ${motel.isFeatured ? `
            <div style="display: inline-flex; align-items: center; gap: 4px; background: #EDE9FE; color: #6D28D9; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 12px; margin-bottom: 12px;">
              ★ Destacado
            </div>
          ` : ''}
          ${actionButton}
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
    if (userLabelRef.current) {
      userLabelRef.current.setMap(null);
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Red pin with heart for user location ONLY
    const redUserPinSVG = `
      <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" fill="#EF4444" stroke="white" stroke-width="3"/>
        <path d="M16 20.5C16 20.5 11.5 17.5 11.5 14.5C11.5 12.5 13 11 14.5 11C15.5 11 16 11.5 16 11.5C16 11.5 16.5 11 17.5 11C19 11 20.5 12.5 20.5 14.5C20.5 17.5 16 20.5 16 20.5Z" fill="white"/>
      </svg>
    `;

    const redUserPinIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(redUserPinSVG)}`,
      scaledSize: new window.google.maps.Size(32, 45),
      anchor: new window.google.maps.Point(16, 45),
      labelOrigin: new window.google.maps.Point(16, -14),
    };

    const marker = new window.google.maps.Marker({
      position: { lat: location[0], lng: location[1] },
      map: googleMapRef.current,
      icon: redUserPinIcon,
      zIndex: 1200,
      // NO usamos label para evitar tooltip nativo
    });

    // Crear etiqueta HTML personalizada para ubicación de usuario
    class UserLabel extends window.google.maps.OverlayView {
      position: any;
      div: HTMLDivElement | null = null;

      constructor(position: any) {
        super();
        this.position = position;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.background = '#8E2DE2';
        this.div.style.color = '#FFFFFF';
        this.div.style.padding = '6px 12px';
        this.div.style.borderRadius = '10px';
        this.div.style.border = '2px solid #FFFFFF';
        this.div.style.fontSize = '13px';
        this.div.style.fontWeight = '500';
        this.div.style.whiteSpace = 'nowrap';
        this.div.style.cursor = 'pointer';
        this.div.style.zIndex = '1210';
        this.div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        this.div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.div.textContent = 'Tu ubicación';
        this.div.style.pointerEvents = 'auto';

        const panes = this.getPanes();
        panes.overlayLayer.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.position.lat, this.position.lng)
        );
        this.div.style.left = position.x - (this.div.offsetWidth / 2) + 'px';
        this.div.style.top = position.y - 67 + 'px'; // 22px arriba del pin (45px altura pin + 22px separación)
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const userLabel = new UserLabel({ lat: location[0], lng: location[1] });
    userLabel.setMap(googleMapRef.current);
    userLabelRef.current = userLabel;

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="max-width: 200px; padding: 12px; text-align: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #FEE2E2; border-radius: 50%; margin-bottom: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h3 style="font-weight: 700; font-size: 16px; color: #EF4444; margin: 0;">Tu ubicación</h3>
        </div>
      `,
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
