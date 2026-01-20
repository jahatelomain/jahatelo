import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { fetchMotelBySlug } from '../services/motelsApi';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';
import PromosTab from './motelDetail/PromosTab';
import DetailsTab from './motelDetail/DetailsTab';
import RoomsTab from './motelDetail/RoomsTab';
import MenuTab from './motelDetail/MenuTab';
import ReviewsTab from './motelDetail/ReviewsTab';
import { trackMotelView, trackPhoneClick, trackWhatsAppClick } from '../services/analyticsService';

const Tab = createMaterialTopTabNavigator();

export default function MotelDetailScreen({ route, navigation }) {
  const { motelSlug, motelId } = route.params || {};
  const [motel, setMotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();

  // Valores animados para favorito
  const heartScale = useSharedValue(1);
  const heartRotation = useSharedValue(0);

  // Priorizar slug, caer a ID si no hay slug
  const identifier = motelSlug || motelId;

  const loadMotel = async () => {
    if (!identifier) {
      setError('No se proporcionó ID o slug del motel');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchMotelBySlug(identifier);
      setMotel(data);

      // Track vista del motel
      if (data?.id) {
        trackMotelView(data.id, 'DETAIL');
      }
    } catch (err) {
      console.error('Error al cargar motel:', err);
      setError(err.message || 'Error al cargar el motel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMotel();
  }, [identifier]);

  // Handler para llamada telefónica con haptic
  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Track click en teléfono
    if (motel?.id) {
      trackPhoneClick(motel.id, 'DETAIL');
    }

    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('No se puede abrir el marcador telefónico');
        }
      })
      .catch((err) => console.error('Error al intentar llamar:', err));
  };

  // Handler para WhatsApp con haptic
  const handleWhatsApp = (whatsappNumber) => {
    if (!whatsappNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Track click en WhatsApp
    if (motel?.id) {
      trackWhatsAppClick(motel.id, 'DETAIL');
    }

    // Remover caracteres no numéricos
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('No se puede abrir WhatsApp');
        }
      })
      .catch((err) => console.error('Error al abrir WhatsApp:', err));
  };

  // Handler para favorito con animación
  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animación del corazón
    heartScale.value = withSpring(1.5, { damping: 10, stiffness: 300 }, () => {
      heartScale.value = withSpring(1.2, { damping: 8 }, () => {
        heartScale.value = withSpring(1, { damping: 10 });
      });
    });

    heartRotation.value = withTiming(360, { duration: 500 }, () => {
      heartRotation.value = 0;
    });

    toggleFavorite(motel);
  };

  // Estilos animados
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value },
      { rotate: `${heartRotation.value}deg` },
    ],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="COLORS.primary" />
          <Text style={styles.loadingText}>Cargando motel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mostrar error con botón para reintentar
  if (error || !motel) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="COLORS.primary" />
          <Text style={styles.errorTitle}>Motel no encontrado</Text>
          <Text style={styles.errorText}>
            {error || 'No pudimos cargar la información de este motel.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMotel}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Obtener foto principal del motel o usar placeholder
  const fallbackPattern = require('../assets/motel-placeholder.png');
  const mainPhoto =
    motel.thumbnail ||
    motel.featuredPhoto ||
    motel.photos?.[0] ||
    motel.allPhotos?.[0] ||
    null;
  const mainPhotoUrl =
    typeof mainPhoto === 'string'
      ? mainPhoto
      : mainPhoto?.url || mainPhoto?.photoUrl || null;
  const mainPhotoSource = mainPhotoUrl ? { uri: mainPhotoUrl } : fallbackPattern;
  const isPlaceholder = !mainPhotoUrl;

  const photoHeight = 240 + insets.top;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Galería de fotos con indicador */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.photoContainer, { height: photoHeight, marginTop: -insets.top }]}
      >
        <Image
          source={mainPhotoSource}
          style={[
            styles.motelPhoto,
            { height: photoHeight },
            isPlaceholder && styles.placeholderImage,
          ]}
          resizeMode="cover"
        />

        {/* Badges informativos */}
        <View style={[styles.badgesContainer, { top: insets.top + 70 }]}>
          {motel.hasPromo && (
            <View style={styles.promoBadge}>
              <Ionicons name="pricetag" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>PROMO</Text>
            </View>
          )}
          {motel.plan === 'DIAMOND' && (
            <View style={styles.platinumBadge}>
              <Ionicons name="diamond" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>DIAMOND</Text>
            </View>
          )}
          {motel.plan === 'GOLD' && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.badgeText}>GOLD</Text>
            </View>
          )}
        </View>

        {/* Controles superiores (back + favorito) */}
        <View style={[styles.photoOverlay, { paddingTop: insets.top + 12 }]}>
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              style={styles.backIconButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <TouchableOpacity
              style={styles.favoriteIconButton}
              onPress={handleFavoritePress}
              activeOpacity={0.7}
            >
              <Animated.View style={animatedHeartStyle}>
                <Ionicons
                  name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
                  size={21}
                  color="COLORS.primary"
                />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Header con nombre del motel */}
      <Animated.View entering={SlideInUp.delay(100).duration(500).springify()} style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.motelName} numberOfLines={1}>{motel.nombre}</Text>
          <Text style={styles.motelLocation} numberOfLines={1}>
            {motel.barrio}, {motel.ciudad}
          </Text>
        </View>
        {/* Botones de contacto */}
        <View style={styles.contactButtons}>
          {motel.contact?.phone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleCall(motel.contact.phone)}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color="COLORS.primary" />
            </TouchableOpacity>
          )}
          {motel.contact?.whatsapp && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleWhatsApp(motel.contact.whatsapp)}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Material Top Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarItemStyle: {
            width: 'auto',
            paddingHorizontal: 8,
          },
          tabBarIndicatorStyle: {
            backgroundColor: COLORS.primary,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#666',
        }}
      >
        {/* Construir tabs dinámicamente según contenido disponible */}
        {(() => {
          const availableTabs = [];

          // Incluir Promos solo si hay promos
          if (motel.promos && motel.promos.length > 0) {
            availableTabs.push({
              name: 'Promos',
              component: PromosTab,
            });
          }

          // Detalles siempre se muestra
          availableTabs.push({
            name: 'Detalles',
            component: DetailsTab,
          });

          // Habitaciones solo si hay rooms
          if (motel.rooms && motel.rooms.length > 0) {
            availableTabs.push({
              name: 'Habitaciones',
              component: RoomsTab,
            });
          }

          // Menú solo si hay categorías de menú
          if (motel.menu && motel.menu.length > 0) {
            availableTabs.push({
              name: 'Menú',
              component: MenuTab,
            });
          }

          // Reseñas siempre se muestra
          availableTabs.push({
            name: 'Reseñas',
            component: ReviewsTab,
          });

          return availableTabs.map((tab) => (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={tab.component}
              initialParams={{ motel }}
            />
          ));
        })()}
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
    overflow: 'hidden',
  },
  motelPhoto: {
    width: SCREEN_WIDTH,
    height: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  placeholderImage: {
    opacity: 0.5,
  },
  badgesContainer: {
    position: 'absolute',
    right: 16,
    gap: 8,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  platinumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    elevation: 5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    flex: 1,
  },
  motelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  motelLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A0038',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A0038',
  },
});
