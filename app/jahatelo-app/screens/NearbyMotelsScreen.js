import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MotelCard from '../components/MotelCard';
import MotelCardSkeleton from '../components/MotelCardSkeleton';
import { COLORS } from '../constants/theme';
import { fetchMotels } from '../services/motelsApi';
import { filterMotelsByDistance } from '../utils/location';

// Opciones de radio disponibles
const RADIUS_OPTIONS = [
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: null, label: 'Todos' },
];

const debugLog = (...args) => {
  if (__DEV__) console.log(...args);
};

export default function NearbyMotelsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [motels, setMotels] = useState([]);
  const [allMotels, setAllMotels] = useState([]); // Todos los moteles sin filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(10); // Radio por defecto 10km
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  useEffect(() => {
    loadNearbyMotels();
  }, []);

  // Filtrar moteles cuando cambie el radio seleccionado
  useEffect(() => {
    if (userLocation && allMotels.length > 0) {
      filterMotelsByRadius(selectedRadius);
    }
  }, [selectedRadius]);

  const loadNearbyMotels = async () => {
    try {
      setLoading(true);
      setError(null);

      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Necesitamos acceso a tu ubicación para encontrar moteles cercanos.');
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      debugLog('📍 Obteniendo ubicación del usuario...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      debugLog(`📍 Ubicación del usuario: [${latitude}, ${longitude}]`);

      // Obtener todos los moteles
      const fetchedMotels = await fetchMotels();
      debugLog(`📊 Total de moteles disponibles: ${fetchedMotels.length}`);

      // Guardar todos los moteles
      setAllMotels(fetchedMotels);

      // Filtrar moteles cercanos con el radio por defecto
      filterMotelsByRadius(selectedRadius, fetchedMotels, { latitude, longitude });
    } catch (err) {
      debugLog('❌ Error al obtener moteles cercanos:', err);
      setError('No pudimos obtener tu ubicación. Verifica que el GPS esté activado.');
    } finally {
      setLoading(false);
    }
  };

  const filterMotelsByRadius = (radius, motelsToFilter = allMotels, location = userLocation) => {
    if (!location) return;

    const { latitude, longitude } = location;

    // Si radius es null, mostrar todos los moteles
    if (radius === null) {
      // Agregar distancia a todos los moteles y ordenar
      const motelsWithDistance = motelsToFilter.map(motel => {
        const motelLat = motel.latitude || motel.lat;
        const motelLon = motel.longitude || motel.lng;

        if (!motelLat || !motelLon) return null;

        const distance = calculateDistance(latitude, longitude, motelLat, motelLon);
        return {
          ...motel,
          distance: distance.toFixed(1)
        };
      })
      .filter(Boolean)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setMotels(motelsWithDistance);
      debugLog(`🎯 Mostrando todos los ${motelsWithDistance.length} moteles`);
    } else {
      // Filtrar por radio específico
      const filtered = filterMotelsByDistance(motelsToFilter, latitude, longitude, radius);
      setMotels(filtered);
      debugLog(`🎯 Mostrando ${filtered.length} moteles dentro de ${radius}km`);
      // No usar error para "sin resultados"; se maneja con el empty state
      setError(null);
    }
  };

  // Función auxiliar para calcular distancia (copia de utils/location.js)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees) => degrees * (Math.PI / 180);

  const handleRetry = () => {
    loadNearbyMotels();
  };

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  };

  const headerPaddingTop = insets.top + 12;
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Moteles cerca mío</Text>
      <View style={styles.placeholder} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {renderHeader()}

        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Text style={styles.subtitle}>Buscando moteles cercanos...</Text>
          </View>
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <MotelCardSkeleton key={`nearby-skeleton-${index}`} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        {renderHeader()}

        <View style={styles.centerContainer}>
          <Ionicons name="location-outline" size={64} color={COLORS.muted} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {renderHeader()}

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.subtitle}>
            {motels.length} {motels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          </Text>
          {userLocation && (
            <TouchableOpacity
              style={styles.locationBadge}
              onPress={() => setShowRadiusModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={12} color={COLORS.primary} />
              <Text style={styles.locationText}>
                Radio: {selectedRadius === null ? 'Todos' : `${selectedRadius} km`}
              </Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={motels}
          keyExtractor={(item) => item.id?.toString()}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          renderItem={({ item }) => (
            <MotelCard
              motel={{
                ...item,
                distanciaKm: parseFloat(item.distance), // Convertir string a number para formatDistance
              }}
              onPress={() => handleMotelPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyText}>
                No hay moteles cerca de tu ubicación
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => setShowRadiusModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="options" size={18} color={COLORS.white} />
                <Text style={styles.emptyActionText}>Cambiar radio</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Modal de selección de radio */}
      <Modal
        visible={showRadiusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRadiusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar radio de búsqueda</Text>
            </View>
            {RADIUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.radiusOption,
                  selectedRadius === option.value && styles.radiusOptionSelected,
                ]}
                onPress={() => {
                  setSelectedRadius(option.value);
                  setShowRadiusModal(false);
                }}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    selectedRadius === option.value && styles.radiusOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedRadius === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  centerText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    paddingVertical: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  radiusOptionSelected: {
    backgroundColor: COLORS.accentLight,
  },
  radiusOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
