import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);

/**
 * Componente AdPopup - Modal de anuncio publicitario
 * Se muestra al abrir la app si hay anuncios de tipo POPUP_HOME
 */
export default function AdPopup({ ad, visible, onClose, onTrackView, onTrackClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [ready, setReady] = useState(false);

  const imageUrl = ad?.largeImageUrlApp || ad?.largeImageUrl || ad?.imageUrl;
  const hasContent = Boolean(
    imageUrl ||
    ad?.title ||
    ad?.description ||
    ad?.advertiser ||
    ad?.linkUrl
  );

  useEffect(() => {
    if (visible && ad) {
      setImageLoaded(false);
      setImageError(false);
      setReady(false);
      if (imageUrl) {
        Image.prefetch(imageUrl)
          .then(() => setReady(true))
          .catch(() => setReady(true));
      } else {
        setReady(true);
      }
    }
  }, [visible, ad, imageUrl]);

  useEffect(() => {
    if (visible && ready && ad) {
      // Registrar vista cuando el popup ya es visible
      onTrackView(ad.id);
    }
  }, [visible, ready, ad, onTrackView]);

  if (!ad || !hasContent) {
    return null;
  }

  const handleCtaPress = async () => {
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

  if (!visible || !ready) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Botón cerrar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {/* Contenido del anuncio */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator
          >
            {/* Imagen del anuncio */}
            {imageUrl && !imageError ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={[
                    styles.image,
                    !imageLoaded && styles.imagePlaceholder,
                  ]}
                  resizeMode="cover"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                  }}
                />
                {!imageLoaded && (
                  <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Cargando...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.imageContainer, styles.fallbackImage]}>
                <Ionicons name="megaphone" size={36} color={COLORS.white} />
                <Text style={styles.fallbackText}>Publicidad</Text>
              </View>
            )}

            {/* Información del anuncio */}
            <View style={styles.infoContainer}>
              {(ad.title || !imageUrl || imageError) && (
                <Text style={styles.title} numberOfLines={2}>
                  {ad.title || 'Publicidad'}
                </Text>
              )}

              {ad.description && <Text style={styles.description}>{ad.description}</Text>}

              {ad.advertiser && (
                <Text style={styles.advertiser} numberOfLines={1}>
                  Anuncio de {ad.advertiser}
                </Text>
              )}

              {ad.linkUrl && (
                <TouchableOpacity style={styles.ctaButton} onPress={handleCtaPress} activeOpacity={0.85}>
                  <Text style={styles.ctaText}>Ver más</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: POPUP_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  contentContainer: {
    paddingBottom: SPACING.lg,
  },
  imageContainer: {
    width: '100%',
    height: POPUP_WIDTH * 1.2, // Proporción 5:6
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  fallbackImage: {
    backgroundColor: COLORS.primaryDark,
    gap: SPACING.sm,
  },
  fallbackText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  infoContainer: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    lineHeight: FONT_SIZES.md * 1.5,
    marginBottom: SPACING.md,
  },
  advertiser: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  ctaText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
