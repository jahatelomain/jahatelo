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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const LABEL_ZOOM_THRESHOLD = 0.55;
const IS_ANDROID = Platform.OS === 'android';

/**
 * ===== SOLUCIÓN ANDROID: OVERLAY ABSOLUTO =====
 *
 * Problema: react-native-maps en Android tiene severas limitaciones con Views complejas dentro de markers.
 * - Callouts con tooltip no se muestran automáticamente
 * - Views personalizadas se recortan o desaparecen
 * - showCallout() programático no funciona consistentemente
 *
 * Solución: Renderizar etiquetas como Views absolutas SOBRE el mapa
 * - El Marker solo contiene el pin (simple View sin complejidad)
 * - Las etiquetas se renderizan fuera del MapView como overlays absolutos
 * - Calculamos posiciones de pantalla basadas en coordenadas geográficas
 * - Total control sobre rendering, sin clipping
 *
 * Esta solución:
 * ✅ Funciona en Expo Go
 * ✅ No requiere librerías adicionales
 * ✅ Sin problemas de rendering
 * ✅ iOS sin cambios (sigue usando two-marker approach que funciona perfecto)
 */

// Componente de etiqueta overlay para Android
// MÉTODO OPTIMIZADO: useRef + transform (sin re-renders innecesarios)
const LabelOverlay = React.memo(({ motel, mapRef, visible, region }) => {
  const labelRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const [initialPosition, setInitialPosition] = useState(null);

  // Calcular posición inicial solo una vez
  useEffect(() => {
    if (!visible || !mapRef.current || initialPosition) return;

    const getInitialPosition = async () => {
      try {
        const labelLatitude = motel.latitude + 0.00008;
        const point = await mapRef.current.pointForCoordinate({
          latitude: labelLatitude,
          longitude: motel.longitude,
        });

        if (point && point.x !== undefined && point.y !== undefined) {
          setInitialPosition(point);
          lastPositionRef.current = point;
        }
      } catch (error) {
        console.error('Error getting initial position:', error);
      }
    };

    getInitialPosition();
  }, [motel.latitude, motel.longitude, visible, mapRef, initialPosition]);

  // Actualizar posición usando setNativeProps (sin re-render)
  useEffect(() => {
    if (!visible || !mapRef.current || !labelRef.current || !initialPosition) {
      return;
    }

    const updatePosition = async () => {
      try {
        const labelLatitude = motel.latitude + 0.00008;
        const point = await mapRef.current.pointForCoordinate({
          latitude: labelLatitude,
          longitude: motel.longitude,
        });

        if (point && point.x !== undefined && point.y !== undefined) {
          // Usar setNativeProps para actualizar posición sin re-render
          if (labelRef.current) {
            labelRef.current.setNativeProps({
              style: {
                transform: [
                  { translateX: point.x - initialPosition.x },
                  { translateY: point.y - initialPosition.y }
                ]
              }
            });
          }

          lastPositionRef.current = point;
        }
      } catch (error) {
        // Silenciar errores durante movimiento rápido
      }
    };

    // Usar requestAnimationFrame para sincronizar con frames del dispositivo
    const scheduleUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePosition();
      });
    };

    scheduleUpdate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [motel.latitude, motel.longitude, visible, region, mapRef, initialPosition]);

  if (!visible || !initialPosition) {
    return null;
  }

  const isDisabled = motel.isFinanciallyEnabled === false;

  return (
    <View
      ref={labelRef}
      collapsable={false}
      style={[
        styles.androidLabelOverlay,
        {
          left: initialPosition.x,
          top: initialPosition.y,
        },
      ]}
      pointerEvents="none"
    >
      <View collapsable={false} style={[styles.androidLabelContainer, isDisabled && styles.disabledLabel]}>
        <Text style={styles.androidLabelText} numberOfLines={1}>
          {motel.name}
        </Text>
      </View>
    </View>
  );
});

LabelOverlay.displayName = 'LabelOverlay';

// Custom Marker component for iOS - etiqueta encima del pin
const CustomMarkerIOS = React.memo(({ motel, showLabel, onPress }) => {
  const isDisabled = motel.isFinanciallyEnabled === false;
  const pinColor = isDisabled ? '#CCCCCC' : COLORS.primary;

  return (
    <Marker
      coordinate={{
        latitude: motel.latitude,
        longitude: motel.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.iosMarkerContainer, isDisabled && { opacity: 0.5 }]}>
        {/* Etiqueta arriba - solo visible cuando showLabel es true */}
        {showLabel && (
          <View style={[styles.iosLabel, isDisabled && styles.disabledLabel]}>
            <Text style={styles.iosLabelText} numberOfLines={1}>
              {motel.name}
            </Text>
          </View>
        )}
        {/* Pin abajo - siempre visible */}
        <Ionicons name="location" size={28} color={pinColor} style={styles.iosPin} />
      </View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  return prevProps.motel.id === nextProps.motel.id &&
         prevProps.showLabel === nextProps.showLabel &&
         prevProps.motel.isFinanciallyEnabled === nextProps.motel.isFinanciallyEnabled;
});

CustomMarkerIOS.displayName = 'CustomMarkerIOS';

// Simple marker for Android - just the pin, no complex views
// MÉTODO 2 MEJORADO: tracksViewChanges 500ms + collapsable={false} + anchor fijo
const CustomMarkerAndroid = React.memo(({ motel, onPress }) => {
  const [tracksChanges, setTracksChanges] = React.useState(true);
  const isDisabled = motel.isFinanciallyEnabled === false;

  // MÉTODO 2: Desactivar tracking después de 500ms (render inicial completo)
  React.useEffect(() => {
    const timer = setTimeout(() => setTracksChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      key={`android-${motel.id}`}
      coordinate={{
        latitude: motel.latitude,
        longitude: motel.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      centerOffset={{ x: 0, y: 0 }}
      onPress={onPress}
      tracksViewChanges={tracksChanges}
      zIndex={999}
    >
      <View collapsable={false} style={[styles.androidMarkerPin, isDisabled && styles.disabledMarker]}>
        <View collapsable={false} style={styles.markerInner}>
          <Ionicons name="heart" size={14} color={COLORS.white} />
        </View>
      </View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  return prevProps.motel.id === nextProps.motel.id &&
         prevProps.motel.isFinanciallyEnabled === nextProps.motel.isFinanciallyEnabled;
});

CustomMarkerAndroid.displayName = 'CustomMarkerAndroid';

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
  const [showLabels, setShowLabels] = useState(
    (initialRegion?.latitudeDelta || 1) <= LABEL_ZOOM_THRESHOLD
  );
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/mobile/motels/map`);
      const data = await response.json();

      if (data.success && data.motels.length > 0) {
        setMotels(data.motels);

        const firstMotelRegion = {
          latitude: data.motels[0].latitude,
          longitude: data.motels[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        setInitialRegion(firstMotelRegion);
        setRegion(firstMotelRegion);
        setShowLabels(firstMotelRegion.latitudeDelta <= LABEL_ZOOM_THRESHOLD);

        setTimeout(() => {
          mapRef.current?.animateToRegion(firstMotelRegion, 1000);
        }, 500);
      } else {
        setError('No hay moteles con ubicación disponibles');
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
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
      setShowLabels(newRegion.latitudeDelta <= LABEL_ZOOM_THRESHOLD);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error',
        'No pudimos obtener tu ubicación. Verifica que el GPS esté activado.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMarkerPress = useCallback((motel) => {
    // No permitir navegación si está financieramente deshabilitado
    if (motel.isFinanciallyEnabled === false) {
      return;
    }

    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  }, [navigation]);

  const handleRegionChangeComplete = useCallback((newRegion) => {
    if (newRegion?.latitudeDelta) {
      setRegion(newRegion);
      setShowLabels(newRegion.latitudeDelta <= LABEL_ZOOM_THRESHOLD);
    }
  }, []);

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
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => setMapReady(true)}
      >
        {motels.map((motel) =>
          IS_ANDROID ? (
            <CustomMarkerAndroid
              key={motel.id}
              motel={motel}
              onPress={() => handleMarkerPress(motel)}
            />
          ) : (
            <CustomMarkerIOS
              key={motel.id}
              motel={motel}
              showLabel={showLabels}
              onPress={() => handleMarkerPress(motel)}
            />
          )
        )}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Tu ubicación"
            pinColor="#D32F2F"
            tracksViewChanges={false}
          />
        )}
      </MapView>

      {/*
        ANDROID LABEL OVERLAYS
        Renderizados FUERA del MapView como Views absolutas
        Se posicionan basándose en cálculo de coordenadas a puntos de pantalla
      */}
      {IS_ANDROID && mapReady && motels.map((motel) => (
        <LabelOverlay
          key={`overlay-${motel.id}`}
          motel={motel}
          mapRef={mapRef}
          visible={showLabels}
          region={region}
        />
      ))}

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

  // ===== iOS STYLES =====
  iosMarkerContainer: {
    alignItems: 'center',
  },
  iosLabel: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 6,
    zIndex: 2,
    minWidth: 60,
    maxWidth: 180,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iosLabelText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  iosPin: {
    zIndex: 1,
  },

  // ===== ANDROID STYLES =====
  androidMarkerPin: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    // Sombra para que se destaque
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Overlay absoluto para etiquetas en Android
  androidLabelOverlay: {
    position: 'absolute',
    transform: [{ translateX: -90 }, { translateY: -10 }], // Centrar horizontalmente, posicionar pegado al pin
    zIndex: 1000,
    pointerEvents: 'none', // No interferir con interacción del mapa
  },
  androidLabelContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    maxWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra para que se destaque sobre el mapa
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  androidLabelText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ===== DISABLED STYLES =====
  disabledMarker: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  disabledLabel: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
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
    zIndex: 999, // Debajo de las etiquetas overlay
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
