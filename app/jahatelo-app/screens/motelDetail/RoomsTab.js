import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { formatPrice } from '../../services/motelsApi';

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
        <View key={room.id} style={styles.roomCard}>
          <Text style={styles.roomName}>{room.name}</Text>

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
            <Text style={styles.roomPriceLabel}>DESDE</Text>
            <Text style={styles.roomPrice}>{formatPrice(room.basePrice)}</Text>
            {room.priceLabel && (
              <Text style={styles.roomPriceLabel}> {room.priceLabel}</Text>
            )}
          </View>

          {/* Amenities de la habitación */}
          {room.amenities && room.amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
              {room.amenities.map((amenity, index) => {
                const amenityName = typeof amenity === 'string' ? amenity : amenity.name;
                return (
                  <View key={index} style={styles.amenityPill}>
                    <Text style={styles.amenityText}>{amenityName}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 4,
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
    color: '#FF2E93',
    marginHorizontal: 6,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenityPill: {
    backgroundColor: '#F0E6F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2A0038',
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
