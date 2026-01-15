import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

/**
 * Modal de detalle para anuncios publicitarios
 * Muestra imagen grande y toda la información del anuncio
 */
export default function AdDetailModal({ visible, ad, onClose, onTrackClick }) {
  const translateY = useSharedValue(MODAL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    } else {
      // Animación de salida
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(MODAL_HEIGHT, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const handleLinkPress = async () => {
    if (ad?.linkUrl) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Track click
      if (onTrackClick) {
        onTrackClick(ad.id);
      }

      // Abrir link
      try {
        const canOpen = await Linking.canOpenURL(ad.linkUrl);
        if (canOpen) {
          await Linking.openURL(ad.linkUrl);
          // Cerrar modal después de abrir link
          handleClose();
        }
      } catch (error) {
        console.warn('Error opening ad link:', error);
      }
    }
  };

  if (!ad) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.modal, modalStyle]}>
          {/* Header con imagen */}
          <View style={styles.imageContainer}>
            {ad.imageUrl ? (
              <Image
                source={{ uri: ad.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={64} color={COLORS.muted} />
              </View>
            )}

            {/* Gradiente overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            />

            {/* Badge de publicidad */}
            <View style={styles.adBadge}>
              <Ionicons name="megaphone" size={14} color={COLORS.white} />
              <Text style={styles.adBadgeText}>PUBLICIDAD</Text>
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Título */}
            <Text style={styles.title}>{ad.title}</Text>

            {/* Descripción */}
            {ad.description && (
              <Text style={styles.description}>{ad.description}</Text>
            )}

            {/* Botón de acción */}
            {ad.linkUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLinkPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Ver más información</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}

            {/* Info adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.muted} />
              <Text style={styles.infoText}>
                Este es un anuncio publicitario patrocinado
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    height: MODAL_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  imageContainer: {
    width: '100%',
    height: MODAL_HEIGHT * 0.45,
    backgroundColor: COLORS.backgroundDark,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  adBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});
