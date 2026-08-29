import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { normalizeMotelPlan, MOTEL_PLANS } from '../constants/motelPlans';
import { useNavigation } from '@react-navigation/native';
import { getApiRoot } from '../services/apiBaseUrl';
import { withCachedMapMarkerImages } from '../services/mapMarkerCache';
import { useOnlineRetry } from '../hooks/useOnlineRetry';
import AppStateView from '../components/AppStateView';
import { showErrorMessage } from '../utils/appFeedback';

const API_URL = getApiRoot();
const MAP_REQUEST_TIMEOUT_MS = 10000;
// IDs públicos de Google Maps, cada uno asociado al diseño cloud de Jahatelo.
// El estilo publicado oculta únicamente los alojamientos de Google para no
// duplicar los pines propios de Jahatelo.
const GOOGLE_MAP_ID = Platform.select({
  ios: '5a5c021d949062e756d2bbdd',
  android: '5a5c021d949062e775a5d0c4',
});

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

const getPlanOrder = (plan) => {
  switch (plan) {
    case 'FREE':
      return 1;
    case 'BASIC':
      return 2;
    case 'GOLD':
      return 3;
    case 'DIAMOND':
      return 4;
    default:
      return 2;
  }
};

const getPlanZIndex = (plan) => {
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

const getMarkerImage = (motel) => {
  if (motel.markerImageUri) return { uri: motel.markerImageUri };

  switch (normalizeMotelPlan(motel.plan)) {
    case MOTEL_PLANS.DIAMOND:
      return require('../assets/map-pin-diamond.png');
    case MOTEL_PLANS.GOLD:
      return require('../assets/map-pin-gold.png');
    case MOTEL_PLANS.FREE:
      return require('../assets/map-pin-free.png');
    default:
      return require('../assets/map-pin-basic.png');
  }
};

// Los PNG locales se dibujan directamente por el SDK nativo. A diferencia de
// las vistas React dentro de <Marker>, no se rasterizan de nuevo durante cada
// zoom/pan, por lo que todos los pines pueden ser de Jahatelo desde el inicio.
const CustomMarker = React.memo(({ motel, onPress }) => {
  const plan = normalizeMotelPlan(motel.plan);
  const planZIndex = getPlanZIndex(plan);
  return (
    <Marker
      coordinate={{ latitude: motel.latitude, longitude: motel.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={planZIndex}
      image={getMarkerImage(motel)}
      onPress={onPress}
      tracksViewChanges={false}
    />
  );
}, (prevProps, nextProps) => {
  return prevProps.motel.id === nextProps.motel.id &&
         prevProps.motel.plan === nextProps.motel.plan;
});

CustomMarker.displayName = 'CustomMarker';

// Cache simple en memoria para reducir llamadas al API
let cachedMapData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function MapScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [motels, setMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -25.2637,
    longitude: -57.5759,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const mapRef = React.useRef(null);

  const sortedMotels = useMemo(() => {
    return [...motels].sort((a, b) => {
      const planDiff = getPlanOrder(a.plan) - getPlanOrder(b.plan);
      if (planDiff !== 0) return planDiff;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [motels]);

  useEffect(() => {
    fetchMapData();
  }, []);

  // Retry automático al reconectar a internet
  useOnlineRetry(useCallback(() => {
    if (error) fetchMapData();
  }, [error]));

  const fetchMapData = async () => {
    try {
      setLoading(true);

      const now = Date.now();
      if (cachedMapData && (now - cacheTimestamp) < CACHE_DURATION) {
        debugLog('📍 Usando datos del mapa cacheados');
        const cachedMotels = await withCachedMapMarkerImages(cachedMapData.motels, API_URL);
        cachedMapData = { ...cachedMapData, motels: cachedMotels };
        setMotels(cachedMotels);

        if (cachedMotels.length > 0) {
          const firstMotelRegion = {
            latitude: cachedMotels[0].latitude,
            longitude: cachedMotels[0].longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          };
          setInitialRegion(firstMotelRegion);
        }
        setLoading(false);
        return;
      }

      debugLog('📍 Cargando datos del mapa desde API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MAP_REQUEST_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(`${API_URL}/api/mobile/motels/map`, {
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        debugLog('❌ Error: respuesta no es JSON', {
          status: response.status,
          contentType,
          url: response.url,
        });
        setError('Error al cargar datos del mapa. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.motels.length > 0) {
        const mapMotels = await withCachedMapMarkerImages(data.motels, API_URL);
        cachedMapData = { ...data, motels: mapMotels };
        cacheTimestamp = now;

        setMotels(mapMotels);

        const firstMotelRegion = {
          latitude: mapMotels[0].latitude,
          longitude: mapMotels[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        setInitialRegion(firstMotelRegion);

        setTimeout(() => {
          mapRef.current?.animateToRegion(firstMotelRegion, 1000);
        }, 500);
      } else {
        setError('No hay moteles con ubicación disponibles');
      }
    } catch (err) {
      debugLog('Error fetching map data:', err);
      if (err?.name === 'AbortError') {
        setError('Tiempo de espera agotado al cargar el mapa');
      } else {
        setError('Error al cargar el mapa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCenterOnMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        showErrorMessage('Necesitamos acceso a tu ubicación para centrarte en el mapa.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      debugLog('Error getting location:', error);
      showErrorMessage('No pudimos obtener tu ubicación. Verificá que el GPS esté activado.');
    }
  };

  const handleMarkerPress = useCallback((motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  }, [navigation]);

  if (loading) {
    return <LoadingScreen message="Cargando mapa..." />;
  }

  if (error) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.errorContainer}>
          <AppStateView type="error" title="No pudimos cargar el mapa" message={error} actionLabel="Reintentar" onAction={fetchMapData} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const headerPaddingTop = insets.top + 12;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Moteles</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            googleMapId={GOOGLE_MAP_ID}
            initialRegion={initialRegion}
            showsUserLocation={!!userLocation}
            showsMyLocationButton={false}
          >
          {sortedMotels.map((motel) => (
            <CustomMarker
              key={motel.id}
              motel={motel}
              onPress={() => handleMarkerPress(motel)}
            />
          ))}

          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Tu ubicación"
              pinColor="#D32F2F"
              zIndex={1200}
              tracksViewChanges={false}
            />
          )}
        </MapView>

      </View>

      {/* Center on Me Button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={handleCenterOnMe}
        accessibilityRole="button"
        accessibilityLabel="Centrar mapa en mi ubicación"
        accessibilityHint="Solicita permiso de ubicación si todavía no fue concedido"
      >
        <Ionicons name="locate" size={24} color={COLORS.white} />
        <Text style={styles.centerButtonText}>Centrar en mí</Text>
      </TouchableOpacity>

      {/* Info Badge */}
      <View style={styles.infoBadge}>
        <Text style={styles.infoBadgeText}>
          {motels.length} motel{motels.length !== 1 ? 'es' : ''} en el mapa
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  centerButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  centerButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 999,
  },
  infoBadgeText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
