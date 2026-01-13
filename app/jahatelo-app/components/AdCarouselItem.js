import { useEffect, useState, useRef } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const SPACING = 16;

const COLORS = {
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.55)',
};

/**
 * Componente AdCarouselItem - Item de anuncio para carruseles
 * Compatible con PromoCarousel, mantiene el mismo estilo y animaciones
 */
export default function AdCarouselItem({
  ad,
  index,
  scrollX,
  onTrackView,
  onTrackClick
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    // Registrar vista solo una vez cuando el componente se monta
    if (ad && !viewTracked.current) {
      onTrackView(ad.id);
      viewTracked.current = true;
    }
  }, [ad, onTrackView]);

  if (!ad) {
    return null;
  }

  const handleAdPress = async () => {
    // Registrar click
    onTrackClick(ad.id);

    // Si tiene linkUrl, abrir en navegador
    if (ad.linkUrl) {
      try {
        const canOpen = await Linking.canOpenURL(ad.linkUrl);
        if (canOpen) {
          await Linking.openURL(ad.linkUrl);
        }
      } catch (error) {
        console.warn('Error opening ad link:', error);
      }
    }
  };

  // Usar imagen del anuncio o imagen grande si existe
  const image = ad.imageUrl || ad.largeImageUrl || 'https://via.placeholder.com/400x300';

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
      <TouchableOpacity activeOpacity={0.9} onPress={handleAdPress}>
        <ImageBackground
          source={{ uri: image }}
          style={styles.card}
          imageStyle={styles.cardImage}
          onLoad={() => setImageLoaded(true)}
        >
          {/* Badge de Publicidad */}
          <View style={styles.adBadge}>
            <Ionicons name="megaphone" size={14} color={COLORS.white} />
            <Text style={styles.adBadgeText}>PUBLICIDAD</Text>
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
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {ad.description}
                </Text>
              )}

              {ad.advertiser && (
                <View style={styles.advertiserContainer}>
                  <Text style={styles.advertiserText} numberOfLines={1}>
                    {ad.advertiser}
                  </Text>
                </View>
              )}

              {ad.linkUrl && (
                <View style={styles.ctaContainer}>
                  <Text style={styles.ctaText}>Ver más</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: 240,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: 20,
  },
  adBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 20,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
    lineHeight: 18,
  },
  advertiserContainer: {
    marginBottom: 8,
  },
  advertiserText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});
