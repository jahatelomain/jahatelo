import React, { useRef } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const SPACING = 16;

const COLORS = {
  card: '#FFFFFF',
  text: '#2E0338',
  textMuted: '#6A5E6E',
  overlay: 'rgba(0,0,0,0.55)',
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
      [0.85, 1, 0.85],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(motel)}>
        <ImageBackground source={{ uri: image }} style={styles.card} imageStyle={styles.cardImage} />
      </TouchableOpacity>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {motel.nombre}
      </Text>
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
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: width * 0.4,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardImage: {
    borderRadius: 16,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});
