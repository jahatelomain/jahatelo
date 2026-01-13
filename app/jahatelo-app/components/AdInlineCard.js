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
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

/**
 * Componente AdInlineCard - Tarjeta de anuncio inline
 * Se muestra entre elementos de listados (cada 5 moteles, por ejemplo)
 */
export default function AdInlineCard({ ad, onTrackView, onTrackClick }) {
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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleAdPress}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Badge de publicidad */}
        <View style={styles.adBadge}>
          <Ionicons name="megaphone" size={12} color={COLORS.white} />
          <Text style={styles.adBadgeText}>Publicidad</Text>
        </View>

        {/* Imagen del anuncio */}
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
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            )}
          </View>
        )}

        {/* Contenido del anuncio */}
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

          <View style={styles.footer}>
            {ad.advertiser && (
              <Text style={styles.advertiser} numberOfLines={1}>
                {ad.advertiser}
              </Text>
            )}

            {ad.linkUrl && (
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Ver más</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  adBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  adBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  imageContainer: {
    width: '100%',
    height: 200,
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
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advertiser: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
