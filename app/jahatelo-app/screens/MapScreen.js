import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

// Componente Custom Marker - dos markers separados para evitar bug de Android
const LABEL_OFFSET = 0.00015; // Aproximadamente 16 metros al norte

const CustomMarkerIOS = React.memo(({ motel, showLabel, onPress }) => {
  const [labelTracksChanges, setLabelTracksChanges] = React.useState(IS_ANDROID);

  React.useEffect(() => {
    if (!IS_ANDROID) return;
    if (!showLabel) return;

    setLabelTracksChanges(true);
    const timer = setTimeout(() => setLabelTracksChanges(false), 1200);
    return () => clearTimeout(timer);
  }, [showLabel, motel.id]);

  return (
    <>
      {/* Marker de la etiqueta - solo visible cuando showLabel es true */}
      {showLabel && (
        <Marker
          key={`label-${motel.id}`}
          coordinate={{
            latitude: motel.latitude + LABEL_OFFSET,
            longitude: motel.longitude,
          }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={IS_ANDROID ? labelTracksChanges : false}
          zIndex={1000}
        >
          <View style={styles.labelContainer} collapsable={false} pointerEvents="none">
            <Text style={styles.labelText} numberOfLines={1}>
              {motel.name}
            </Text>
          </View>
        </Marker>
      )}

      {/* Marker del pin - siempre visible */}
      <Marker
        key={`pin-${motel.id}`}
        coordinate={{
          latitude: motel.latitude,
          longitude: motel.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={onPress}
        tracksViewChanges={false}
        zIndex={999}
      >
        <View style={styles.markerPin}>
          <Ionicons name="location" size={28} color={COLORS.primary} />
        </View>
      </Marker>
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.motel.id === nextProps.motel.id &&
         prevProps.showLabel === nextProps.showLabel;
});

CustomMarkerIOS.displayName = 'CustomMarkerIOS';

const CustomMarkerAndroid = React.memo(({ motel, showLabel, onPress }) => {
  const [labelTracksChanges, setLabelTracksChanges] = React.useState(true);

  React.useEffect(() => {
    if (!showLabel) return;
    setLabelTracksChanges(true);
    const timer = setTimeout(() => setLabelTracksChanges(false), 800);
    return () => clearTimeout(timer);
  }, [showLabel, motel.id]);

  return (
    <>
      {showLabel && (
        <Marker
          key={`android-label-${motel.id}`}
          coordinate={{
            latitude: motel.latitude + LABEL_OFFSET,
            longitude: motel.longitude,
          }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={labelTracksChanges}
          zIndex={1000}
        >
          <View
            style={styles.androidLabelContainer}
            collapsable={false}
            pointerEvents="none"
          >
            <Text style={styles.androidLabelText} numberOfLines={1}>
              {motel.name}
            </Text>
          </View>
        </Marker>
      )}

      <Marker
        key={`android-pin-${motel.id}`}
        coordinate={{
          latitude: motel.latitude,
          longitude: motel.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={onPress}
        tracksViewChanges={false}
        zIndex={999}
      >
        <View style={styles.androidMarkerPin} collapsable={false}>
          <Ionicons name="location" size={28} color={COLORS.primary} />
        </View>
      </Marker>
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.motel.id === nextProps.motel.id &&
         prevProps.showLabel === nextProps.showLabel;
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
    latitude: -25.2637, // Asunción, Paraguay por defecto
    longitude: -57.5759,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const mapRef = React.useRef(null);
  const [showLabels, setShowLabels] = useState(
    (initialRegion?.latitudeDelta || 1) <= LABEL_ZOOM_THRESHOLD
  );

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

        // Establecer región inicial solo si hay moteles
        const firstMotelRegion = {
          latitude: data.motels[0].latitude,
          longitude: data.motels[0].longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        setInitialRegion(firstMotelRegion);
        setShowLabels(firstMotelRegion.latitudeDelta <= LABEL_ZOOM_THRESHOLD);

        // Animar el mapa hacia el primer motel
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

      // Centrar mapa en ubicación del usuario (solo con animación, sin cambiar state)
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      mapRef.current?.animateToRegion(newRegion, 1000);
      // Ajustar visibilidad de labels según zoom al centrar
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
        onRegionChangeComplete={(region) => {
          if (region?.latitudeDelta) {
            setShowLabels(region.latitudeDelta <= LABEL_ZOOM_THRESHOLD);
          }
        }}
      >
        {motels.map((motel) =>
          IS_ANDROID ? (
            <CustomMarkerAndroid
              key={motel.id}
              motel={motel}
              showLabel={showLabels}
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
  // Etiqueta morada (marker separado)
  labelContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    maxWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'visible',
  },
  labelText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Pin (marker separado)
  markerPin: {
    padding: 4,
    backgroundColor: 'transparent',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  androidLabelContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    maxWidth: 160,
    alignItems: 'center',
  },
  androidLabelText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
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
