import React from 'react';
import { Dimensions, FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  card: '#FFFFFF',
  text: '#2E0338',
  textMuted: '#6A5E6E',
  overlay: 'rgba(0,0,0,0.55)',
};

const PromoCard = ({ motel }) => {
  const image =
    motel.photos?.[0]?.url ||
    motel.fotos?.[0] ||
    motel.thumbnail ||
    'https://images.unsplash.com/photo-1559599238-4b9b034d4e9e?auto=format&fit=crop&w=1400&q=80';

  return (
    <ImageBackground source={{ uri: image }} style={styles.card} imageStyle={styles.cardImage}>
      <View style={styles.cardOverlay} />
      <Text style={styles.cardTitle} numberOfLines={1}>{motel.nombre}</Text>
      <Text style={styles.cardSubtitle}>Ver promoción</Text>
    </ImageBackground>
  );
};

export default function PromoCarousel({ promos = [] }) {
  if (!promos.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.curvedContainer}>
        <Text style={styles.sectionTitle}>Promociones</Text>
        <Text style={styles.sectionSubtitle}>Descuentos exclusivos para vos</Text>
        <FlatList
          data={promos}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => <PromoCard motel={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={width * 0.6 + 16}
          decelerationRate="fast"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  curvedContainer: {
    backgroundColor: COLORS.card,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  card: {
    width: width * 0.6,
    height: width * 0.4,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardImage: {
    borderRadius: 16,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
});
