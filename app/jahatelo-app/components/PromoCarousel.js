import React, { useRef, useEffect, useState } from 'react';
import { Animated as RNAnimated, Dimensions, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from '../utils/reanimatedCompat';
import { getMotelPlanGlowTone, hasMotelPlanGlow } from '../constants/motelPlans';
import MotelLogoHeart from './MotelLogoHeart';
import { getMotelImageSource, hasRemoteMotelImage } from '../utils/mediaSource';
import { PLAN_COLORS } from '../constants/theme';

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

const getMotelImageUrls = (motel) => {
  if (!motel) return [];
  const candidates = [
    motel.thumbnail,
    motel.featuredPhotoApp,
    motel.featuredPhotoWeb,
    motel.featuredPhoto,
    motel.photoUrl,
    motel.imageUrl,
    motel.imagen,
    motel.photos?.[0],
    motel.fotos?.[0],
  ];
  return [...new Set(candidates.map(resolveImageUrl).filter(Boolean))];
};

const PromoCard = ({ motel, onPress, index, scrollX, iosScrollX, activeIndex, badgeLabel = 'PROMO', badgeIconName = 'pricetag' }) => {
  const imageUrls = getMotelImageUrls(motel);
  const imageKey = imageUrls.join('|');
  const [imageIndex, setImageIndex] = useState(0);
  const resolvedImageUrl = imageUrls[imageIndex] || null;
  const imageSource = getMotelImageSource(resolvedImageUrl);
  const isPlaceholder = !hasRemoteMotelImage(resolvedImageUrl);
  const hasPlanGlow = hasMotelPlanGlow(motel?.plan);
  const glowTone = getMotelPlanGlowTone(motel?.plan);
  const glowColors = glowTone === 'gold'
    ? [PLAN_COLORS.gold, PLAN_COLORS.goldLight, PLAN_COLORS.goldDark, PLAN_COLORS.goldSoft]
    : [PLAN_COLORS.diamond, PLAN_COLORS.diamondLight, PLAN_COLORS.diamondDark, PLAN_COLORS.diamondSoft];

  useEffect(() => {
    setImageIndex(0);
  }, [imageKey]);

  const inputRange = [
    (index - 1) * (CARD_WIDTH + SPACING),
    index * (CARD_WIDTH + SPACING),
    (index + 1) * (CARD_WIDTH + SPACING),
  ];

  const iosAnimatedStyle = Platform.OS === 'ios'
    ? {
        transform: [{
          scale: iosScrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          }),
        }],
        opacity: iosScrollX.interpolate({
          inputRange,
          outputRange: [0.7, 1, 0.7],
          extrapolate: 'clamp',
        }),
        zIndex: index === activeIndex ? 100 : 1,
      }
    : null;

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return {};
    }

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

  const card = (
    <TouchableOpacity style={styles.cardClip} activeOpacity={0.9} onPress={() => onPress?.(motel)}>
      <ImageBackground
        source={imageSource}
        style={styles.card}
        imageStyle={[styles.cardImage, isPlaceholder && styles.placeholderImage]}
        onError={() => setImageIndex((current) => current + 1)}
      >
        {motel?.logoUrl ? (
          <View style={styles.motelLogoBadge} pointerEvents="none">
            <MotelLogoHeart uri={motel.logoUrl} size={48} />
          </View>
        ) : null}
        <View style={styles.promoBadge}>
          <Ionicons name={badgeIconName} size={14} color={COLORS.white} />
          <Text style={styles.promoBadgeText}>{badgeLabel}</Text>
        </View>

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
                {motel.ciudad}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <CarouselAnimatedView style={[styles.cardWrapper, Platform.OS === 'ios' ? iosAnimatedStyle : animatedStyle]}>
      {hasPlanGlow ? (
        <LinearGradient
          colors={glowColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planGlowFrame}
        >
          <View style={styles.planGlowInner}>{card}</View>
        </LinearGradient>
      ) : card}
    </CarouselAnimatedView>
  );
};

const AdCard = ({ ad, onPress, index, scrollX, iosScrollX, activeIndex, onTrackView }) => {
  const viewTracked = useRef(false);

  useEffect(() => {
    // Registrar vista solo una vez cuando el card se monta
    if (ad && !viewTracked.current && onTrackView) {
      onTrackView(ad.id);
      viewTracked.current = true;
    }
  }, [ad, onTrackView]);

  const image = ad.imageUrl || null;
  const imageSource = getMotelImageSource(image);
  const isPlaceholder = !hasRemoteMotelImage(image);

  const inputRange = [
    (index - 1) * (CARD_WIDTH + SPACING),
    index * (CARD_WIDTH + SPACING),
    (index + 1) * (CARD_WIDTH + SPACING),
  ];

  const iosAnimatedStyle = Platform.OS === 'ios'
    ? {
        transform: [{
          scale: iosScrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          }),
        }],
        opacity: iosScrollX.interpolate({
          inputRange,
          outputRange: [0.7, 1, 0.7],
          extrapolate: 'clamp',
        }),
        zIndex: index === activeIndex ? 100 : 1,
      }
    : null;

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return {};
    }

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
    <CarouselAnimatedView style={[styles.cardWrapper, Platform.OS === 'ios' ? iosAnimatedStyle : animatedStyle]}>
      <TouchableOpacity style={styles.cardClip} activeOpacity={0.9} onPress={handlePress}>
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
    </CarouselAnimatedView>
  );
};

const CarouselAnimatedView = Platform.OS === 'ios' ? RNAnimated.View : Animated.View;

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
  const iosScrollX = useRef(new RNAnimated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

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

  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
  }, [mixedItems.length]);

  if (!mixedItems.length) return null;

  const syncActiveIndexFromOffset = (offsetX) => {
    if (Platform.OS !== 'ios') return;
    const nextIndex = Math.round(offsetX / (CARD_WIDTH + SPACING));
    const clampedIndex = Math.max(0, Math.min(nextIndex, mixedItems.length - 1));
    if (clampedIndex === activeIndexRef.current) return;
    activeIndexRef.current = clampedIndex;
    setActiveIndex(clampedIndex);
  };

  const handleMomentumScrollEnd = (event) => {
    syncActiveIndexFromOffset(event.nativeEvent.contentOffset.x);
  };

  const iosNativeScrollHandler = Platform.OS === 'ios'
    ? RNAnimated.event(
        [{ nativeEvent: { contentOffset: { x: iosScrollX } } }],
        {
          useNativeDriver: true,
          listener: (event) => {
            syncActiveIndexFromOffset(event.nativeEvent.contentOffset.x);
          },
        }
      )
    : undefined;

  const CarouselFlatList = Platform.OS === 'ios' ? RNAnimated.FlatList : Animated.FlatList;

  const renderItem = ({ item, index }) => {
    if (item.type === 'ad') {
      return (
        <AdCard
          ad={item.data}
          onPress={onAdClick}
          onTrackView={onAdView}
          index={index}
          scrollX={scrollX}
          iosScrollX={iosScrollX}
          activeIndex={activeIndex}
        />
      );
    }

    return (
      <PromoCard
        motel={item.data}
        onPress={onPromoPress}
        index={index}
        scrollX={scrollX}
        iosScrollX={iosScrollX}
        activeIndex={activeIndex}
        badgeLabel={badgeLabel}
        badgeIconName={badgeIconName}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.curvedContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <CarouselFlatList
          data={mixedItems}
          extraData={Platform.OS === 'ios' ? activeIndex : undefined}
          keyExtractor={(item, index) => `${item.type}-${item.data.id || index}`}
          renderItem={renderItem}
          horizontal
          style={styles.list}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          onScroll={Platform.OS === 'ios' ? iosNativeScrollHandler : scrollHandler}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollEndDrag={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    marginBottom: 6,
  },
  curvedContainer: {
    backgroundColor: '#F8F5FA',
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  list: {
    overflow: 'visible',
  },
  cardWrapper: {
    marginRight: SPACING,
    borderRadius: 20,
  },
  cardClip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  planGlowFrame: {
    padding: 2,
    borderRadius: 22,
    overflow: 'hidden',
  },
  planGlowInner: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  card: {
    width: CARD_WIDTH,
    height: width * 0.5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 20,
  },
  placeholderImage: {
    opacity: 0.5,
  },
  motelLogoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
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
