import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { filterMotelsByDistance } from '../utils/location';
import { COLORS } from '../constants/theme';

export default function HomeHeader({ motels = [], onMotelPress }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [nearbyMotels, setNearbyMotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const placeholderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(placeholderOpacity, {
          toValue: 0.25,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(placeholderOpacity, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [placeholderOpacity]);

  const handleNearbyPress = async () => {
    setLoading(true);
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu ubicación para encontrar moteles cercanos.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Filtrar moteles cercanos (dentro de 10km)
      const filtered = filterMotelsByDistance(motels, latitude, longitude, 10);

      if (filtered.length === 0) {
        Alert.alert(
          'Sin resultados',
          'No encontramos moteles a menos de 10 km de tu ubicación.',
          [{ text: 'OK' }]
        );
      } else {
        setNearbyMotels(filtered);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert(
        'Error',
        'No pudimos obtener tu ubicación. Verifica que el GPS esté activado.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.cityButton}
          activeOpacity={0.85}
          onPress={handleNearbyPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <>
              <Ionicons name="location" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
              <Text style={styles.cityText}>Cerca mío</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>¡Hola!</Text>
        <Text style={styles.subGreeting}>Encontrá tu próximo destino</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          placeholder=""
          style={styles.searchInput}
          value={searchValue}
          onChangeText={setSearchValue}
        />
        <TouchableOpacity style={styles.searchAction}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
        {!searchValue && (
          <Animated.Text style={[styles.animatedPlaceholder, { opacity: placeholderOpacity }]}>
            Buscar moteles, barrios o amenities
          </Animated.Text>
        )}
      </View>

      {/* Modal de moteles cercanos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Moteles cerca tuyo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={nearbyMotels}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.motelItem}
                  onPress={() => {
                    setModalVisible(false);
                    onMotelPress?.(item);
                  }}
                >
                  <View style={styles.motelInfo}>
                    <Text style={styles.motelName}>{item.nombre}</Text>
                    <Text style={styles.motelAddress}>{item.direccion || 'Sin dirección'}</Text>
                  </View>
                  <View style={styles.distanceTag}>
                    <Ionicons name="navigate" size={14} color={COLORS.accent} />
                    <Text style={styles.distanceText}>{item.distance} km</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron moteles cercanos</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: COLORS.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cityText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  greetingBlock: {
    marginTop: 14,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  subGreeting: {
    fontSize: 13,
    color: '#D8B4FE',
    marginTop: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    marginLeft: 6,
    flex: 1,
    color: COLORS.text,
  },
  searchAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 40,
    right: 60,
    color: COLORS.muted,
    fontSize: 13,
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 40,
    right: 60,
    color: COLORS.muted,
    fontSize: 13,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  motelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  motelInfo: {
    flex: 1,
    marginRight: 12,
  },
  motelName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  motelAddress: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  distanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
});
