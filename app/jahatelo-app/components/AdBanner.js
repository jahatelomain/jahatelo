import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const BANNER_HEIGHT = 120;

/**
 * Componente AdBanner - Banner publicitario horizontal
 * Se muestra como sección destacada entre contenido
 */
export default function AdBanner({ ad, onTrackView, onTrackClick }) {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAdPress}
        style={styles.banner}
      >
        {/* Badge de publicidad */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>PUBLICIDAD</Text>
        </View>

        {/* Imagen del anuncio (lado izquierdo) */}
        {ad.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: ad.imageUrl }}
              style={[
                styles.image,
                !imageLoaded && styles.imagePlaceholder,
              ]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>...</Text>
              </View>
            )}
          </View>
        )}

        {/* Contenido del anuncio (lado derecho) */}
        <View style={styles.content}>
          {ad.title && (
            <Text style={styles.title} numberOfLines={2}>
              {ad.title}
            </Text>
          )}

          {ad.description && (
            <Text style={styles.description} numberOfLines={2}>
              {ad.description}
            </Text>
          )}

          {ad.linkUrl && (
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Ver más</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BANNER_WIDTH,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  banner: {
    flexDirection: 'row',
    height: BANNER_HEIGHT,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  adBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm / 2,
    zIndex: 1,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  imageContainer: {
    width: BANNER_HEIGHT,
    height: BANNER_HEIGHT,
    backgroundColor: COLORS.backgroundDark,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    opacity: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  loadingText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: FONT_SIZES.sm * 1.4,
    marginBottom: SPACING.xs,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
