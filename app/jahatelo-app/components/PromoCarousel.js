import React, { useRef } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const SPACING = 16;

const COLORS = {
  card: '#FFFFFF',
  text: '#2E0338',
  textMuted: '#6A5E6E',
  overlay: 'rgba(0,0,0,0.55)',
  accent: '#FF6B6B',
  white: '#FFFFFF',
};

const PromoCard = ({ motel, onPress, index, scrollX }) => {
  const image =
    motel.photos?.[0]?.url ||
    motel.fotos?.[0] ||
    motel.thumbnail ||
    'https://images.unsplash.com/photo-1559599238-4b9b034d4e9e?auto=format&fit=crop&w=1400&q=80';

  const inputRange = [
    (index - 1) * (CARD_WIDTH + SPACING),
    index * (CARD_WIDTH + SPACING),
    (index + 1) * (CARD_WIDTH + SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(motel)}>
        <ImageBackground source={{ uri: image }} style={styles.card} imageStyle={styles.cardImage}>
          {/* Badge de Promoción */}
          <View style={styles.promoBadge}>
            <Ionicons name="pricetag" size={14} color={COLORS.white} />
            <Text style={styles.promoBadgeText}>PROMO</Text>
          </View>

          {/* Gradiente overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {motel.nombre}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.white} />
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {motel.barrio || motel.ciudad}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PromoCarousel({ promos = [], onPromoPress }) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  if (!promos.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.curvedContainer}>
        <Text style={styles.sectionTitle}>Promociones</Text>
        <Animated.FlatList
          data={promos}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item, index }) => (
            <PromoCard motel={item} onPress={onPromoPress} index={index} scrollX={scrollX} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
  },
  curvedContainer: {
    backgroundColor: COLORS.card,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    marginRight: SPACING,
  },
  card: {
    width: CARD_WIDTH,
    height: width * 0.5,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardImage: {
    borderRadius: 20,
  },
  promoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  promoBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.95,
  },
});
