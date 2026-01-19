import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatPrice } from '../../services/motelsApi';
import { getAmenityIconConfig } from '../../constants/amenityIcons';
import { COLORS } from '../../constants/theme';

export default function DetailsTab({ route }) {
  const { motel } = route.params || {};

  if (!motel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información del motel</Text>
      </View>
    );
  }

  const handleOpenMaps = () => {
    if (motel.location && motel.location.lat && motel.location.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${motel.location.lat},${motel.location.lng}`;
      Linking.openURL(url).catch(err => console.error('Error al abrir Google Maps:', err));
    }
  };

  const hasLocation = motel.location && motel.location.lat && motel.location.lng;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Información básica */}
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            {motel.barrio}, {motel.ciudad}
          </Text>
        </View>

        {!!motel.rating && (
          <View style={styles.infoRow}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.infoText}>
              {motel.rating} / 5.0
            </Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Desde</Text>
          <Text style={styles.price}>{formatPrice(motel.precioDesde)}</Text>
        </View>
      </View>

      {/* Botón Google Maps */}
      <TouchableOpacity
        style={[styles.mapsButton, !hasLocation && styles.mapsButtonDisabled]}
        onPress={handleOpenMaps}
        disabled={!hasLocation}
        activeOpacity={0.7}
      >
        <Ionicons name="map-outline" size={24} color={hasLocation ? "#FFFFFF" : "#999"} />
        <Text style={[styles.mapsButtonText, !hasLocation && styles.mapsButtonTextDisabled]}>
          {hasLocation ? 'Ver ubicación en Google Maps' : 'Ubicación no disponible'}
        </Text>
      </TouchableOpacity>

      {/* Amenities generales */}
      {motel.amenities && motel.amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comodidades generales</Text>
          <View style={styles.amenitiesGrid}>
            {motel.amenities.map((amenity, index) => {
              const amenityData = typeof amenity === 'string' ? { name: amenity } : amenity;
              const iconConfig = getAmenityIconConfig(amenityData.icon);

              const handleAmenityPress = () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Comodidad', amenityData.name);
              };

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.amenityCircle}
                  onPress={handleAmenityPress}
                  activeOpacity={0.7}
                >
                  {iconConfig ? (
                    <MaterialCommunityIcons
                      name={iconConfig.name}
                      size={28}
                      color={COLORS.primary}
                    />
                  ) : (
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  mapsButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  mapsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  mapsButtonTextDisabled: {
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  amenityCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A0038',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
