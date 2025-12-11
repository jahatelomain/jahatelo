import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, formatDistance } from '../services/motelsApi';
import { useFavorites } from '../hooks/useFavorites';

export default function MotelCard({ motel, onPress }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!motel) return null;

  const handleFavoritePress = (e) => {
    // Prevenir que se dispare el onPress de la card
    e.stopPropagation();
    toggleFavorite(motel);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.motelName}>{motel.nombre}</Text>
        <View style={styles.headerRight}>
          {motel.distanciaKm && (
            <Text style={styles.distance}>{formatDistance(motel.distanciaKm)}</Text>
          )}
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
              size={24}
              color="#FF2E93"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.location}>{motel.barrio}, {motel.ciudad}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Desde</Text>
        <Text style={styles.price}>{formatPrice(motel.precioDesde)}</Text>
      </View>

      {motel.amenities && motel.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {motel.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityPill}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.ratingRow}>
        {!!motel.rating && (
          <Text style={styles.ratingText}>⭐ {motel.rating}</Text>
        )}
        {motel.tienePromo && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>PROMO</Text>
          </View>
        )}
        {motel.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>PREMIUM</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  motelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF2E93',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenityPill: {
    backgroundColor: '#F0E6F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#2A0038',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  promoBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  promoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  featuredBadge: {
    backgroundColor: '#FF2E93',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
