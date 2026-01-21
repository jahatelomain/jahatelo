import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatPrice } from '../../services/motelsApi';
import { getAmenityIconConfig } from '../../constants/amenityIcons';
import { COLORS } from '../../constants/theme';

export default function DetailsTab({ route }) {
  const { motel } = route.params || {};
  const [showAmenitiesSheet, setShowAmenitiesSheet] = useState(false);

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

  const amenitiesList = (motel.amenities || []).map((amenity) =>
    typeof amenity === 'string' ? { name: amenity } : amenity
  );

  const handleAmenitiesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAmenitiesSheet(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Información básica */}
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {motel.barrio}, {motel.ciudad}
          </Text>
        </View>

        {!!motel.rating && (
          <View style={styles.infoRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
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
        <Ionicons name="map-outline" size={19} color={hasLocation ? "#FFFFFF" : "#999"} />
        <Text style={[styles.mapsButtonText, !hasLocation && styles.mapsButtonTextDisabled]}>
          {hasLocation ? 'Ver ubicación en Google Maps' : 'Ubicación no disponible'}
        </Text>
      </TouchableOpacity>

      {/* Amenities generales */}
      {amenitiesList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenitiesList.map((amenityData, index) => {
              const iconConfig = getAmenityIconConfig(amenityData.icon);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.amenityCircle}
                  onPress={handleAmenitiesPress}
                  activeOpacity={0.7}
                >
                  {iconConfig ? (
                    <MaterialCommunityIcons
                      name={iconConfig.name}
                      size={22}
                      color={COLORS.primary}
                    />
                  ) : (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Modal
        visible={showAmenitiesSheet}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAmenitiesSheet(false)}
      >
        <View style={styles.sheetContainer}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowAmenitiesSheet(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Amenities</Text>
              <TouchableOpacity
                onPress={() => setShowAmenitiesSheet(false)}
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {amenitiesList.map((amenityData, index) => {
                const iconConfig = getAmenityIconConfig(amenityData.icon);
                return (
                  <View key={`${amenityData.name}-${index}`} style={styles.sheetRow}>
                    <View style={styles.sheetIcon}>
                      {iconConfig ? (
                        <MaterialCommunityIcons
                          name={iconConfig.name}
                          size={20}
                          color={COLORS.primary}
                        />
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </View>
                    <Text style={styles.sheetRowText}>{amenityData.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  mapsButtonTextDisabled: {
    color: '#999',
  },
  sectionTitle: {
    fontSize: 14,
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
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sheetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetRowText: {
    fontSize: 14,
    color: COLORS.text,
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
