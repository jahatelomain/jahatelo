import { useEffect, useState } from 'react';
import {
  Modal,
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
const POPUP_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);

/**
 * Componente AdPopup - Modal de anuncio publicitario
 * Se muestra al abrir la app si hay anuncios de tipo POPUP_HOME
 */
export default function AdPopup({ ad, visible, onClose, onTrackView, onTrackClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (visible && ad) {
      // Registrar vista cuando se muestra el popup
      onTrackView(ad.id);
      setImageLoaded(false);
    }
  }, [visible, ad, onTrackView]);

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

    // Cerrar popup después de hacer click
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Usar imagen grande si existe, sino usar imagen normal
  const imageUrl = ad.largeImageUrl || ad.imageUrl;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleAdPress}
            style={styles.content}
          >
            {/* Imagen del anuncio */}
            {imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
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

            {/* Información del anuncio */}
            <View style={styles.infoContainer}>
              {ad.title && (
                <Text style={styles.title} numberOfLines={2}>
                  {ad.title}
                </Text>
              )}

              {ad.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {ad.description}
                </Text>
              )}

              {ad.advertiser && (
                <Text style={styles.advertiser} numberOfLines={1}>
                  Anuncio de {ad.advertiser}
                </Text>
              )}

              {ad.linkUrl && (
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Ver más</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: POPUP_WIDTH * 1.2, // Proporción 5:6
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
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
