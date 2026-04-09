import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../../services/motelsApi';
import { getAmenityIconConfig } from '../../constants/amenityIcons';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { shareRoom } from '../../utils/share';

function RoomCard({ room, motel }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef(null);

  const handleAmenityLongPress = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setShowTooltip(true);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 3000);
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shareRoom(motel, room);
  }, [motel, room]);

  const amenities = room.amenities || [];

  // Amenities que tienen icono configurado (para los círculos)
  const amenitiesWithIcon = amenities
    .map((a) => {
      const data = typeof a === 'string' ? { name: a } : a;
      return { name: data.name, iconConfig: getAmenityIconConfig(data.icon) };
    })
    .filter((a) => a.iconConfig);

  // Todos los nombres para el tooltip
  const allNames = amenities
    .map((a) => (typeof a === 'string' ? a : a.name))
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{room.name}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {room.description && (
        <Text style={styles.roomDescription}>{room.description}</Text>
      )}

      {/* Fotos de la habitación */}
      {room.photos && room.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
          contentContainerStyle={styles.photosScrollContent}
        >
          {room.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.roomPhoto}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.roomPriceRow}>
        {room.priceLabel && room.priceLabel.trim().length > 0 ? (
          <Text style={[styles.roomPriceLabel, { fontWeight: '600' }]}>{room.priceLabel}</Text>
        ) : (
          <>
            <Text style={styles.roomPriceLabel}>DESDE</Text>
            <Text style={styles.roomPrice}>
              {room.basePrice && room.basePrice > 0
                ? formatPrice(room.basePrice)
                : 'CONSULTAR'}
            </Text>
          </>
        )}
      </View>

      {/* Amenities: solo iconos, long press muestra tooltip */}
      {amenitiesWithIcon.length > 0 && (
        <View style={styles.amenitiesSection}>
          <View style={styles.amenitiesRow}>
            {amenitiesWithIcon.map((amenity, index) => (
              <TouchableOpacity
                key={index}
                style={styles.amenityCircle}
                onLongPress={handleAmenityLongPress}
                delayLongPress={400}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={amenity.iconConfig.name}
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {showTooltip && (
            <Text style={styles.tooltipText}>{allNames}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function RoomsTab({ route }) {
  const { motel } = route.params || {};

  if (!motel || !motel.rooms || motel.rooms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay habitaciones disponibles</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {motel.rooms.map((room) => (
        <RoomCard key={room.id} room={room} motel={motel} />
      ))}
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
  roomCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 12,
  },
  roomPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginHorizontal: 6,
  },
  amenitiesSection: {
    marginBottom: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  photosScroll: {
    marginTop: 12,
    marginBottom: 0,
  },
  photosScrollContent: {
    paddingRight: 8,
  },
  roomPhoto: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
