import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MotelCard from '../components/MotelCard';
import { COLORS } from '../constants/theme';
import { fetchMotels } from '../services/motelsApi';
import { filterMotelsByDistance } from '../utils/location';

export default function NearbyMotelsScreen({ navigation }) {
  const [motels, setMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadNearbyMotels();
  }, []);

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
      console.log('📍 Obteniendo ubicación del usuario...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      console.log(`📍 Ubicación del usuario: [${latitude}, ${longitude}]`);

      // Obtener todos los moteles
      const allMotels = await fetchMotels();
      console.log(`📊 Total de moteles disponibles: ${allMotels.length}`);

      // Filtrar moteles cercanos (dentro de 10km)
      const nearbyMotels = filterMotelsByDistance(allMotels, latitude, longitude, 10);

      if (nearbyMotels.length === 0) {
        setError('No encontramos moteles a menos de 10 km de tu ubicación.');
      } else {
        console.log(`🎯 Mostrando ${nearbyMotels.length} moteles cercanos`);
        setMotels(nearbyMotels);
      }
    } catch (err) {
      console.error('❌ Error al obtener moteles cercanos:', err);
      setError('No pudimos obtener tu ubicación. Verifica que el GPS esté activado.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadNearbyMotels();
  };

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moteles cerca mío</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Buscando moteles cercanos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Moteles cerca mío</Text>
          <View style={styles.placeholder} />
        </View>

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moteles cerca mío</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.subtitle}>
            {motels.length} {motels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          </Text>
          {userLocation && (
            <View style={styles.locationBadge}>
              <Ionicons name="navigate" size={12} color={COLORS.primary} />
              <Text style={styles.locationText}>Radio: 10 km</Text>
            </View>
          )}
        </View>

        <FlatList
          data={motels}
          keyExtractor={(item) => item.id?.toString()}
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
            </View>
          }
        />
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
    paddingVertical: 12,
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
});
