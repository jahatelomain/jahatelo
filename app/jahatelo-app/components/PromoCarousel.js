import React, { useRef, useEffect } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
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
  adAccent: '#FFA500',
};

const resolveImageUrl = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value && typeof value === 'object') {
    const candidate = value.url || value.photoUrl;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
};

const getMotelImageUrl = (motel) => {
  if (!motel) return null;
  const candidates = [
    motel.promoImageUrl,
    motel.thumbnail,
    motel.photoUrl,
    motel.imageUrl,
    motel.imagen,
    motel.photos?.[0],
    motel.fotos?.[0],
  ];
  for (const candidate of candidates) {
    const resolved = resolveImageUrl(candidate);
    if (resolved) return resolved;
  }
  return null;
};

const PromoCard = ({ motel, onPress, index, scrollX, badgeLabel = 'PROMO', badgeIconName = 'pricetag' }) => {
  const fallbackPattern = require('../assets/motel-placeholder.png');
  const imageUrl = getMotelImageUrl(motel);
  const imageSource = imageUrl ? { uri: imageUrl } : fallbackPattern;
  const isPlaceholder = !imageUrl;

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
        <ImageBackground
          source={imageSource}
          style={styles.card}
          imageStyle={[styles.cardImage, isPlaceholder && styles.placeholderImage]}
        >
          {/* Badge de Promoción */}
          <View style={styles.promoBadge}>
            <Ionicons name={badgeIconName} size={14} color={COLORS.white} />
            <Text style={styles.promoBadgeText}>{badgeLabel}</Text>
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

const AdCard = ({ ad, onPress, index, scrollX, onTrackView }) => {
  const viewTracked = useRef(false);

  useEffect(() => {
    // Registrar vista solo una vez cuando el card se monta
    if (ad && !viewTracked.current && onTrackView) {
      onTrackView(ad.id);
      viewTracked.current = true;
    }
  }, [ad, onTrackView]);

  const fallbackPattern = require('../assets/motel-placeholder.png');
  const image = ad.imageUrl || null;
  const imageSource = image ? { uri: image } : fallbackPattern;
  const isPlaceholder = !image;

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

  const handlePress = () => {
    // Abrir modal con detalles del anuncio
    if (onPress) {
      onPress(ad);
    }
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <ImageBackground
          source={imageSource}
          style={styles.card}
          imageStyle={[styles.cardImage, isPlaceholder && styles.placeholderImage]}
        >
          {/* Badge de Publicidad */}
          <View style={[styles.promoBadge, styles.adBadge]}>
            <Ionicons name="megaphone" size={14} color={COLORS.white} />
            <Text style={styles.promoBadgeText}>PUBLICIDAD</Text>
          </View>

          {/* Gradiente overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {ad.title}
              </Text>
              {ad.description && (
                <Text style={styles.adDescription} numberOfLines={2}>
                  {ad.description}
                </Text>
              )}
              {ad.linkUrl && (
                <View style={styles.locationRow}>
                  <Text style={styles.adLink}>Ver más</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.white} />
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PromoCarousel({
  promos = [],
  ads = [],
  onPromoPress,
  onAdClick,
  onAdView,
  title = 'Promociones',
  badgeLabel = 'PROMO',
  badgeIconName = 'pricetag'
}) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Mezclar promos con anuncios cada 5 items o al final si hay menos de 5
  const mixedItems = React.useMemo(() => {
    if (!ads || ads.length === 0) {
      return promos.map(item => ({ type: 'promo', data: item }));
    }

    const result = [];
    const itemsPerAd = 5;

    promos.forEach((promo, index) => {
      result.push({ type: 'promo', data: promo });

      // Insertar anuncio cada 5 items
      if ((index + 1) % itemsPerAd === 0 && ads.length > 0) {
        const adIndex = Math.floor(index / itemsPerAd) % ads.length;
        result.push({ type: 'ad', data: ads[adIndex] });
      }
    });

    // Si no llegamos a 5 destacados, agregar anuncio al final
    if (promos.length < itemsPerAd && ads.length > 0) {
      result.push({ type: 'ad', data: ads[0] });
    }

    return result;
  }, [promos, ads]);

  if (!mixedItems.length) return null;

  const renderItem = ({ item, index }) => {
    if (item.type === 'ad') {
      return (
        <AdCard
          ad={item.data}
          onPress={onAdClick}
          onTrackView={onAdView}
          index={index}
          scrollX={scrollX}
        />
      );
    }

    return (
      <PromoCard
        motel={item.data}
        onPress={onPromoPress}
        index={index}
        scrollX={scrollX}
        badgeLabel={badgeLabel}
        badgeIconName={badgeIconName}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.curvedContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Animated.FlatList
          data={mixedItems}
          keyExtractor={(item, index) => `${item.type}-${item.data.id || index}`}
          renderItem={renderItem}
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
    marginTop: 4, // Reducido de 12 a 4 para acercar a header
    marginBottom: 12,
  },
  curvedContainer: {
    backgroundColor: COLORS.card,
    paddingTop: 10, // Reducido de 18 a 10 para menos espacio antes del título
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
  placeholderImage: {
    opacity: 0.5,
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
  adBadge: {
    backgroundColor: COLORS.adAccent,
  },
  adDescription: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.9,
    marginBottom: 4,
  },
  adLink: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.95,
  },
});
