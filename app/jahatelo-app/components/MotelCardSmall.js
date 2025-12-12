import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  white: '#FFFFFF',
  muted: '#C5C5C5',
  primary: '#FF2E93',
  card: '#1F0F2E',
};

export default function MotelCardSmall({ motel, onPress }) {
  if (!motel) return null;

  const image = motel.photos?.[0] || motel.thumbnail || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80';
  const ratingText =
    typeof motel.rating === 'number' && motel.rating > 0
      ? motel.rating.toFixed(1)
      : 'N/A';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {motel.nombre}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={COLORS.primary} />
          <Text style={styles.rating}>{ratingText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  image: {
    width: '100%',
    height: 90,
  },
  info: {
    padding: 8,
  },
  name: {
    color: COLORS.white,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: COLORS.muted,
    marginLeft: 4,
    fontSize: 12,
  },
});
