import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { getApiRoot } from '../services/apiBaseUrl';
import { useOnlineRetry } from '../hooks/useOnlineRetry';

const API_URL = getApiRoot();
const MAP_REQUEST_TIMEOUT_MS = 10000;
const IS_ANDROID = Platform.OS === 'android';
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

// ===== CLUSTERING =====
// Agrupa moteles cercanos según el nivel de zoom actual del mapa.
// El radio de clustering escala con latitudeDelta para ser proporcional al zoom.
function clusterMotels(motels, latitudeDelta) {
  // Radio proporcional al zoom: más alejado = clusters más grandes
  const clusterRadius = latitudeDelta * 0.12;

  const visited = new Set();
  const clusters = [];

  for (let i = 0; i < motels.length; i++) {
    if (visited.has(i)) continue;

    const group = [motels[i]];
    visited.add(i);

    for (let j = i + 1; j < motels.length; j++) {
      if (visited.has(j)) continue;

      const dLat = Math.abs(motels[i].latitude - motels[j].latitude);
      const dLng = Math.abs(motels[i].longitude - motels[j].longitude);

      if (dLat < clusterRadius && dLng < clusterRadius) {
        group.add ? group.add(motels[j]) : group.push(motels[j]);
        visited.add(j);
      }
    }

    if (group.length > 1) {
      // Calcular centroide del cluster
      const avgLat = group.reduce((s, m) => s + m.latitude, 0) / group.length;
      const avgLng = group.reduce((s, m) => s + m.longitude, 0) / group.length;

      // El plan más alto del grupo determina el color del cluster
      const bestPlan = group.reduce((best, m) => {
        return getPlanOrder(m.plan) > getPlanOrder(best) ? m.plan : best;
      }, 'FREE');

      clusters.push({
        type: 'cluster',
        id: `cluster_${i}`,
        latitude: avgLat,
        longitude: avgLng,
        count: group.length,
        motels: group,
        bestPlan,
      });
    } else {
      clusters.push({ type: 'single', ...motels[i] });
    }
  }

  return clusters;
}

// ===== CLUSTER MARKER =====
const ClusterMarker = React.memo(({ cluster, onPress }) => {
  const { bestPlan, count, latitude, longitude } = cluster;
  const isDiamond = bestPlan === 'DIAMOND';
  const isGold = bestPlan === 'GOLD';

  const bgColor = isDiamond ? '#7DD3FC' : isGold ? '#F59E0B' : COLORS.primary;

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={500}
      tracksViewChanges={false}
      onPress={IS_ANDROID ? undefined : onPress}
    >
      <View style={[styles.clusterOuter, { borderColor: bgColor }]}>
        <View style={[styles.clusterInner, { backgroundColor: bgColor }]}>
          <Text style={styles.clusterText}>{count}</Text>
        </View>
      </View>

      {IS_ANDROID && (
        <Callout tooltip onPress={onPress}>
          <View style={[styles.calloutContainer, { backgroundColor: bgColor, padding: 12 }]}>
            <Text style={styles.calloutTitle}>{count} moteles</Text>
            <Text style={styles.calloutSubtitle}>Tap para acercar</Text>
          </View>
        </Callout>
      )}
    </Marker>
  );
});

ClusterMarker.displayName = 'ClusterMarker';

// ===== CUSTOM MARKER (individual) =====
const CustomMarker = React.memo(({ motel, onPress }) => {
  const isDisabled = motel.plan === 'FREE';
  const [tracksChanges, setTracksChanges] = useState(IS_ANDROID);
  const plan = motel.plan || 'BASIC';
  const planZIndex = getPlanZIndex(plan);

  const isGold = plan === 'GOLD';
  const isDiamond = plan === 'DIAMOND';
  const sizeMultiplier = isDiamond ? 1.3 : isGold ? 1.15 : 1;
  const pinSize = Math.round(36 * sizeMultiplier);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pinStyle = [
    styles.markerPin,
    isDisabled && styles.disabledMarker,
    isGold && styles.goldMarker,
    isDiamond && styles.diamondMarker,
    { width: pinSize, height: pinSize, borderRadius: Math.round(pinSize / 2) },
  ];
  const labelContainerStyle = [
    styles.iosLabelContainer,
    isDisabled && styles.disabledLabel,
    isGold && styles.goldLabel,
    isDiamond && styles.diamondLabel,
    {
      paddingHorizontal: Math.round(10 * sizeMultiplier),
      paddingVertical: Math.round(4 * sizeMultiplier),
      borderRadius: Math.round(10 * sizeMultiplier),
      maxWidth: Math.round(180 * sizeMultiplier),
    },
  ];
  const labelTextStyle = [
    styles.iosLabelText,
    { fontSize: Math.round(12 * sizeMultiplier) },
  ];
  const calloutStyle = [
    styles.calloutContainer,
    isDisabled && styles.disabledCallout,
    isGold && styles.goldCallout,
    isDiamond && styles.diamondCallout,
    { padding: Math.round(12 * sizeMultiplier) },
  ];

  const shouldAnimate = isGold || isDiamond;

  useEffect(() => {
    if (!IS_ANDROID) return;
    if (shouldAnimate) {
      setTracksChanges(true);
      return;
    }
    const timer = setTimeout(() => setTracksChanges(false), 500);
    return () => clearTimeout(timer);
  }, [shouldAnimate]);

  useEffect(() => {
    if (!isGold && !isDiamond) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounceAnim, isGold, isDiamond]);

  const bounceStyle = isGold || isDiamond ? { transform: [{ translateY: bounceAnim }] } : null;

  return (
    <Marker
      coordinate={{
        latitude: motel.latitude,
        longitude: motel.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={planZIndex}
      onPress={IS_ANDROID ? undefined : onPress}
      tracksViewChanges={IS_ANDROID ? tracksChanges : false}
    >
      <View style={{ alignItems: 'center' }}>
        {!IS_ANDROID && (
          <Animated.View style={[labelContainerStyle, bounceStyle]} pointerEvents="none">
            {isGold && (
              <View style={styles.labelBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
              </View>
            )}
            {isDiamond && (
              <View style={styles.labelBadge}>
                <Ionicons name="diamond" size={12} color="#0EA5E9" />
              </View>
            )}
            <Text style={labelTextStyle} numberOfLines={1}>
              {motel.name}
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[bounceStyle, pinStyle]}>
          <View style={styles.markerInner}>
            <Ionicons
              name="heart"
              size={Math.round((isGold || isDiamond ? 18 : 14) * sizeMultiplier)}
              color={COLORS.white}
            />
          </View>
        </Animated.View>
      </View>

      {IS_ANDROID && (
        <Callout tooltip onPress={onPress}>
          <View style={calloutStyle}>
            {isDiamond && (
              <Text style={[styles.calloutBadge, { fontSize: Math.round(11 * sizeMultiplier) }]}>💎 DIAMOND</Text>
            )}
            {isGold && !isDiamond && (
              <Text style={[styles.calloutBadge, { fontSize: Math.round(11 * sizeMultiplier) }]}>⭐ GOLD</Text>
            )}
            <Text style={[styles.calloutTitle, { fontSize: Math.round(14 * sizeMultiplier) }]} numberOfLines={1}>
              {motel.name}
            </Text>
            <Text style={[styles.calloutSubtitle, { fontSize: Math.round(11 * sizeMultiplier) }]}>Tap para ver detalles</Text>
          </View>
        </Callout>
      )}
    </Marker>
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
  const [currentLatitudeDelta, setCurrentLatitudeDelta] = useState(0.5);
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

  // Aplica clustering según el zoom actual
  const clusteredItems = useMemo(() => {
    // Con zoom muy cercano (delta < 0.05) no agrupar — mostrar todos
    if (currentLatitudeDelta < 0.05) return sortedMotels.map(m => ({ type: 'single', ...m }));
    return clusterMotels(sortedMotels, currentLatitudeDelta);
  }, [sortedMotels, currentLatitudeDelta]);

  useEffect(() => {
    fetchMapData();
  }, []);

  // Retry automático al reconectar a internet
  const { isOnline } = useOnlineRetry(useCallback(() => {
    if (error) fetchMapData();
  }, [error]));

  const fetchMapData = async () => {
    try {
      setLoading(true);

      const now = Date.now();
      if (cachedMapData && (now - cacheTimestamp) < CACHE_DURATION) {
        debugLog('📍 Usando datos del mapa cacheados');
        setMotels(cachedMapData.motels);

        if (cachedMapData.motels.length > 0) {
          const firstMotelRegion = {
            latitude: cachedMapData.motels[0].latitude,
            longitude: cachedMapData.motels[0].longitude,
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
        cachedMapData = data;
        cacheTimestamp = now;

        setMotels(data.motels);

        const firstMotelRegion = {
          latitude: data.motels[0].latitude,
          longitude: data.motels[0].longitude,
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
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu ubicación para centrarte en el mapa.',
          [{ text: 'OK' }]
        );
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
      Alert.alert(
        'Error',
        'No pudimos obtener tu ubicación. Verifica que el GPS esté activado.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkerPress = useCallback((motel) => {
    if (motel.plan === 'FREE') return;
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  }, [navigation]);

  // Al tocar un cluster: acercar el zoom al centroide del grupo
  const handleClusterPress = useCallback((cluster) => {
    const newDelta = Math.max(currentLatitudeDelta * 0.4, 0.01);
    mapRef.current?.animateToRegion({
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      latitudeDelta: newDelta,
      longitudeDelta: newDelta,
    }, 400);
  }, [currentLatitudeDelta]);

  const handleRegionChangeComplete = useCallback((region) => {
    setCurrentLatitudeDelta(region.latitudeDelta);
  }, []);

  if (loading) {
    return <LoadingScreen message="Cargando mapa..." />;
  }

  if (error) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMapData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Moteles</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {clusteredItems.map((item) => {
          if (item.type === 'cluster') {
            return (
              <ClusterMarker
                key={item.id}
                cluster={item}
                onPress={() => handleClusterPress(item)}
              />
            );
          }
          return (
            <CustomMarker
              key={item.id}
              motel={item}
              onPress={() => handleMarkerPress(item)}
            />
          );
        })}

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

      {/* Center on Me Button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={handleCenterOnMe}
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
  map: {
    flex: 1,
  },

  // ===== CLUSTER STYLES =====
  clusterOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // ===== MARKER STYLES =====
  markerPin: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...(Platform.OS === 'android' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    }),
  },
  markerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledMarker: {
    backgroundColor: '#9CA3AF',
    opacity: 1,
  },
  goldMarker: {
    backgroundColor: '#F59E0B',
  },
  diamondMarker: {
    backgroundColor: '#7DD3FC',
  },

  // ===== CALLOUT STYLES =====
  calloutContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutSubtitle: {
    color: COLORS.white,
    fontSize: 11,
    opacity: 0.9,
  },
  disabledCallout: {
    backgroundColor: '#CCCCCC',
  },
  goldCallout: {
    backgroundColor: '#F59E0B',
  },
  diamondCallout: {
    backgroundColor: '#7DD3FC',
  },
  calloutBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  iosLabelContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 3,
    maxWidth: 180,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
  },
  disabledLabel: {
    backgroundColor: '#9CA3AF',
  },
  goldLabel: {
    backgroundColor: '#F59E0B',
  },
  diamondLabel: {
    backgroundColor: '#7DD3FC',
  },
  labelBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosLabelText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
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
