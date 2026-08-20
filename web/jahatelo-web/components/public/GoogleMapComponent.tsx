'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type LatLngLiteral = { lat: number; lng: number };

type GoogleMap = {
  setCenter(position: LatLngLiteral): void;
};

type GoogleInfoWindow = {
  close(): void;
  open(mapOrOptions: GoogleMap | { anchor: GoogleMarker; map: GoogleMap }, anchor?: GoogleMarker): void;
};

type GoogleMarker = {
  map?: GoogleMap | null;
  setMap?(map: GoogleMap | null): void;
  addListener(eventName: string, handler: () => void): void;
  infoWindow?: GoogleInfoWindow;
};

type GoogleCircle = {
  setMap(map: GoogleMap | null): void;
};

type GoogleOverlay = {
  setMap(map: GoogleMap | null): void;
  getPanes(): { floatPane: Node; overlayLayer: Node };
  getProjection(): {
    fromLatLngToDivPixel(position: unknown): { x: number; y: number };
  };
};

type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
  InfoWindow: new (options: { content: string }) => GoogleInfoWindow;
  Circle: new (options: Record<string, unknown>) => GoogleCircle;
  LatLng: new (lat: number, lng: number) => unknown;
  OverlayView: new () => GoogleOverlay;
  marker: {
    AdvancedMarkerElement: new (options: Record<string, unknown>) => GoogleMarker;
  };
};

const BASE_PIN_WIDTH = 32;
const BASE_PIN_HEIGHT = 45;
const BASE_PIN_CENTER = 16;
const BASE_PIN_RADIUS = 13;
const GLOBAL_PIN_SCALE = 1.1;
const BASE_LABEL_GAP = 22;
const EXTRA_LABEL_GAP_PX = 3;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_CONFIG_ERROR = 'API key de Google Maps no configurada. Contacte al administrador.';

function createPinElement(color: string, opacity: number, scale: number) {
  if (typeof document === 'undefined') {
    const fallback = { style: {}, innerHTML: '' } as unknown as HTMLDivElement;
    return fallback;
  }
  const width = Math.round(BASE_PIN_WIDTH * scale);
  const height = Math.round(BASE_PIN_HEIGHT * scale);
  const strokeWidth = Math.max(2, Math.round(3 * scale));
  const circleRadius = Math.round(BASE_PIN_RADIUS * scale);
  const center = Math.round(BASE_PIN_CENTER * scale);

  const pin = document.createElement('div');
  pin.style.width = `${width}px`;
  pin.style.height = `${height}px`;
  pin.style.transform = 'translate(0, 0)';
  pin.style.display = 'block';
  pin.style.pointerEvents = 'auto';

  pin.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="${strokeWidth}"/>
      <path d="M${center} ${Math.round(20.5 * scale)}C${center} ${Math.round(20.5 * scale)} ${Math.round(11.5 * scale)} ${Math.round(17.5 * scale)} ${Math.round(11.5 * scale)} ${Math.round(14.5 * scale)}C${Math.round(11.5 * scale)} ${Math.round(12.5 * scale)} ${Math.round(13 * scale)} ${Math.round(11 * scale)} ${Math.round(14.5 * scale)} ${Math.round(11 * scale)}C${Math.round(15.5 * scale)} ${Math.round(11 * scale)} ${center} ${Math.round(11.5 * scale)} ${center} ${Math.round(11.5 * scale)}C${center} ${Math.round(11.5 * scale)} ${Math.round(16.5 * scale)} ${Math.round(11 * scale)} ${Math.round(17.5 * scale)} ${Math.round(11 * scale)}C${Math.round(19 * scale)} ${Math.round(11 * scale)} ${Math.round(20.5 * scale)} ${Math.round(12.5 * scale)} ${Math.round(20.5 * scale)} ${Math.round(14.5 * scale)}C${Math.round(20.5 * scale)} ${Math.round(17.5 * scale)} ${center} ${Math.round(20.5 * scale)} ${center} ${Math.round(20.5 * scale)}Z" fill="white"/>
    </svg>
  `;
  return pin;
}

type MapMotel = {
  id: string;
  name: string;
  slug: string;
  city: string;
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

type MapPlanConfig = {
  color: string;
  labelColor: string;
  opacity: number;
  scale: number;
  badge: string | null;
  glow: string | null;
};

// Declare global google types
declare global {
  interface Window {
    google: { maps: GoogleMapsApi };
    initMap?: () => void;
  }
}

function createMotelLabelOverlay({
  maps,
  position,
  text,
  planConfig,
  effectiveScale,
  zIndex,
  onClick,
}: {
  maps: GoogleMapsApi;
  position: LatLngLiteral;
  text: string;
  planConfig: MapPlanConfig;
  effectiveScale: number;
  zIndex: number;
  onClick: () => void;
}): GoogleOverlay {
  class MotelLabelOverlay extends maps.OverlayView {
    div: HTMLDivElement | null = null;

    onAdd() {
      this.div = document.createElement('div');
      this.div.style.position = 'absolute';
      this.div.style.background = planConfig.labelColor;
      this.div.style.color = '#FFFFFF';
      this.div.style.padding = `${Math.round(6 * effectiveScale)}px ${Math.round(12 * effectiveScale)}px`;
      this.div.style.borderRadius = `${Math.round(10 * planConfig.scale)}px`;
      this.div.style.border = '2px solid #FFFFFF';
      this.div.style.fontSize = `${Math.round(13 * effectiveScale)}px`;
      this.div.style.fontWeight = '500';
      this.div.style.whiteSpace = 'nowrap';
      this.div.style.cursor = 'pointer';
      this.div.style.zIndex = String(zIndex + 10);
      this.div.style.boxShadow = planConfig.glow
        ? `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 14px ${planConfig.glow}`
        : '0 2px 8px rgba(0, 0, 0, 0.15)';
      this.div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.div.style.maxWidth = `${Math.round(180 * effectiveScale)}px`;
      this.div.style.overflow = 'visible';
      this.div.style.display = 'inline-flex';
      this.div.style.alignItems = 'center';
      this.div.style.pointerEvents = 'auto';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = text;
      nameSpan.style.display = 'inline-block';
      nameSpan.style.maxWidth = `${Math.round(150 * effectiveScale)}px`;
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.textOverflow = 'ellipsis';
      nameSpan.style.whiteSpace = 'nowrap';
      nameSpan.style.verticalAlign = 'middle';
      this.div.appendChild(nameSpan);

      if (planConfig.badge) {
        this.div.style.animation = 'jahatelo-pin-bounce 1.6s ease-in-out infinite';
        const badge = document.createElement('div');
        badge.textContent = planConfig.badge;
        badge.style.position = 'absolute';
        badge.style.top = `${Math.round(-6 * effectiveScale)}px`;
        badge.style.right = `${Math.round(-6 * effectiveScale)}px`;
        badge.style.width = `${Math.round(18 * effectiveScale)}px`;
        badge.style.height = `${Math.round(18 * effectiveScale)}px`;
        badge.style.borderRadius = '999px';
        badge.style.background = '#FFFFFF';
        badge.style.border = `2px solid ${planConfig.color}`;
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.fontSize = `${Math.round(10 * effectiveScale)}px`;
        badge.style.fontWeight = '700';
        badge.style.color = planConfig.color;
        if (planConfig.glow) badge.style.boxShadow = `0 0 10px ${planConfig.glow}`;
        this.div.appendChild(badge);
      }

      this.div.addEventListener('click', onClick);
      this.getPanes().floatPane.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const pixel = this.getProjection().fromLatLngToDivPixel(new maps.LatLng(position.lat, position.lng));
      this.div.style.left = `${pixel.x - this.div.offsetWidth / 2}px`;
      const labelOffset = Math.round(
        BASE_PIN_HEIGHT * effectiveScale + BASE_LABEL_GAP * effectiveScale + EXTRA_LABEL_GAP_PX,
      );
      this.div.style.top = `${pixel.y - labelOffset}px`;
    }

    onRemove() {
      this.div?.parentNode?.removeChild(this.div);
      this.div = null;
    }
  }

  return new MotelLabelOverlay();
}

function createUserLabelOverlay(maps: GoogleMapsApi, position: LatLngLiteral): GoogleOverlay {
  class UserLabelOverlay extends maps.OverlayView {
    div: HTMLDivElement | null = null;

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
      this.getPanes().overlayLayer.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const pixel = this.getProjection().fromLatLngToDivPixel(new maps.LatLng(position.lat, position.lng));
      this.div.style.left = `${pixel.x - this.div.offsetWidth / 2}px`;
      this.div.style.top = `${pixel.y - 67}px`;
    }

    onRemove() {
      this.div?.parentNode?.removeChild(this.div);
      this.div = null;
    }
  }

  return new UserLabelOverlay();
}

export default function GoogleMapComponent({
  motels,
  showRadius,
  initialUserLocation
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const overlaysRef = useRef<GoogleOverlay[]>([]);
  const userMarkerRef = useRef<GoogleMarker | null>(null);
  const userLabelRef = useRef<GoogleOverlay | null>(null);
  const circleRef = useRef<GoogleCircle | null>(null);
  const addUserMarkerRef = useRef<(location: [number, number]) => void>(() => undefined);
  const [isLoaded, setIsLoaded] = useState(
    () => typeof window !== 'undefined' && Boolean(window.google?.maps),
  );
  const [error, setError] = useState<string | null>(GOOGLE_MAPS_API_KEY ? null : GOOGLE_MAPS_CONFIG_ERROR);

  // Load Google Maps script
  useEffect(() => {
    const scriptId = 'google-maps-js';

    if (!GOOGLE_MAPS_API_KEY) return;

    // Check if already loaded
    if (window.google && window.google.maps) {
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker`;
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
      mapId: '5a5c021d949062e767299e61', // Estilo cloud y marcadores avanzados de Jahatelo
      // La web pública siempre usa el diseño claro, independientemente del
      // esquema oscuro del navegador o sistema operativo.
      colorScheme: 'LIGHT',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Add initial user location if provided
    if (initialUserLocation) {
      addUserMarkerRef.current(initialUserLocation);
    }
  }, [isLoaded, motels, initialUserLocation]);

  // Add/update motel markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker?.setMap) {
        marker.setMap(null);
        return;
      }
      if ('map' in marker) {
        marker.map = null;
      }
    });
    markersRef.current = [];
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

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

    const sortedMotels = [...motels].sort(
      (a, b) => getPlanZIndex(a.plan ?? null) - getPlanZIndex(b.plan ?? null)
    );

    // Create markers for each motel
    sortedMotels.forEach((motel) => {
      const planConfig = getPlanConfig(motel.plan ?? null);
      const planZIndex = getPlanZIndex(motel.plan ?? null);
      const effectiveScale = planConfig.scale * GLOBAL_PIN_SCALE;
      const pinElement = createPinElement(planConfig.color, planConfig.opacity, effectiveScale);
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: motel.latitude, lng: motel.longitude },
        map: googleMapRef.current,
        content: pinElement,
        zIndex: planZIndex,
      });

      const customLabel = createMotelLabelOverlay({
        maps: window.google.maps,
        position: { lat: motel.latitude, lng: motel.longitude },
        text: motel.name,
        planConfig,
        effectiveScale,
        zIndex: planZIndex,
        onClick: () => {
          markersRef.current.forEach((existingMarker) => existingMarker.infoWindow?.close());
          marker.infoWindow?.open(googleMapRef.current!, marker);
        },
      });
      customLabel.setMap(googleMapRef.current);
      overlaysRef.current.push(customLabel);

      const actionButtonColor = planConfig.labelColor;
      const actionButton = `
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
            ${motel.city}
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
        infoWindow.open({ anchor: marker, map: googleMapRef.current! });
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
      if (userMarkerRef.current.setMap) {
        userMarkerRef.current.setMap(null);
      } else {
        userMarkerRef.current.map = null;
      }
    }
    if (userLabelRef.current) {
      userLabelRef.current.setMap(null);
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    const redUserPinElement = createPinElement('#EF4444', 1, GLOBAL_PIN_SCALE);

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: { lat: location[0], lng: location[1] },
      map: googleMapRef.current,
      content: redUserPinElement,
      zIndex: 1200,
    });

    const userLabel = createUserLabelOverlay(window.google.maps, { lat: location[0], lng: location[1] });
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
      infoWindow.open(googleMapRef.current!, marker);
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

  useLayoutEffect(() => {
    addUserMarkerRef.current = addUserMarker;
  });

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
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
