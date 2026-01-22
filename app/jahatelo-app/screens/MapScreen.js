import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const IS_ANDROID = Platform.OS === 'android';
const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

// Marker con etiquetas en iOS y tooltip en Android
const CustomMarker = React.memo(({ motel, onPress }) => {
  const isDisabled = motel.plan === 'FREE';
  const [tracksChanges, setTracksChanges] = useState(IS_ANDROID);
  const plan = motel.plan || 'BASIC';

  // Configuración según plan
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

  useEffect(() => {
    if (!IS_ANDROID) return;
    const timer = setTimeout(() => setTracksChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <Marker
      coordinate={{
        latitude: motel.latitude,
        longitude: motel.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      onPress={IS_ANDROID ? undefined : onPress}
      tracksViewChanges={IS_ANDROID ? tracksChanges : false}
    >
      <View style={{ alignItems: 'center' }}>
        {!IS_ANDROID && (
          <View style={labelContainerStyle} pointerEvents="none">
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
          </View>
        )}

        {/* Pin del marker */}
        <Animated.View style={[{ transform: [{ translateY: bounceAnim }] }, pinStyle]}>
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
  const [initialRegion, setInitialRegion] = useState({
    latitude: -25.2637,
    longitude: -57.5759,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const mapRef = React.useRef(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);

      // Usar cache si está disponible y es reciente
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
      const response = await fetch(`${API_URL}/api/mobile/motels/map`);

      // Verificar si la respuesta es JSON antes de parsear
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
        // Guardar en cache
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
      setError('Error al cargar el mapa');
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
    // No permitir navegación si es plan FREE
    if (motel.plan === 'FREE') {
      return;
    }

    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  }, [navigation]);

  if (loading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </>
    );
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
      >
        {motels.map((motel) => (
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
    // Sin sombra para iOS - fondo transparente
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
