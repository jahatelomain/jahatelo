import React from 'react';
import { View, Text, FlatList, StyleSheet, ImageBackground, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  white: '#FFFFFF',
  muted: '#C5C5C5',
  overlay: 'rgba(0,0,0,0.55)',
};

const PromoCard = ({ motel }) => {
  const image = motel.photos?.[0] || motel.thumbnail || 'https://images.unsplash.com/photo-1559599238-4b9b034d4e9e?auto=format&fit=crop&w=1400&q=80';

  return (
    <ImageBackground source={{ uri: image }} style={styles.card} imageStyle={styles.cardImage}>
      <View style={styles.cardOverlay} />
      <Text style={styles.cardTitle} numberOfLines={1}>{motel.nombre}</Text>
      <Text style={styles.cardSubtitle}>Promoción activa</Text>
    </ImageBackground>
  );
};

export default function PromoCarousel({ promos = [] }) {
  if (!promos.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Promociones</Text>
      <FlatList
        data={promos}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => <PromoCard motel={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        pagingEnabled
        snapToInterval={width * 0.8 + 16}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  card: {
    width: width * 0.8,
    height: width * 0.45,
    marginRight: 16,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cardImage: {
    borderRadius: 18,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 4,
  },
});
