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

const Tab = createMaterialTopTabNavigator();

export default function MotelDetailScreen({ route, navigation }) {
  const { motelSlug, motelId } = route.params || {};
  const [motel, setMotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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

  // Mostrar loading
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [motel?.id]);

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
  const mainPhoto = motel.thumbnail || motel.photos?.[0] || 'https://picsum.photos/800/600?random=999';
  const photoGallery = motel.photos && motel.photos.length > 0 ? motel.photos : [mainPhoto];

  const photoHeight = 240 + insets.top;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Galería de fotos con indicador */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.photoContainer, { height: photoHeight, marginTop: -insets.top }]}
      >
        <Animated.FlatList
          data={photoGallery}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setCurrentPhotoIndex(index);
          }}
          renderItem={({ item }) => {
            const photoUrl = typeof item === 'string' ? item : item?.url || item?.photoUrl || null;
            return (
              <Image
                source={{ uri: photoUrl || 'https://picsum.photos/800/600?random=998' }}
                style={[styles.motelPhoto, { height: photoHeight }]}
                resizeMode="cover"
              />
            );
          }}
          keyExtractor={(item, index) => index.toString()}
        />

        {/* Indicador de fotos */}
        {photoGallery.length > 1 && (
          <View style={styles.photoIndicatorContainer}>
            {photoGallery.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhotoIndex && styles.photoIndicatorActive
                ]}
              />
            ))}
          </View>
        )}

        {/* Badges informativos */}
        <View style={[styles.badgesContainer, { top: 70 + insets.top }]}>
          {motel.hasPromo && (
            <View style={styles.promoBadge}>
              <Ionicons name="pricetag" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>PROMO</Text>
            </View>
          )}
          {motel.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>DESTACADO</Text>
            </View>
          )}
        </View>

        {/* Botón volver posicionado sobre la foto */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <TouchableOpacity
            style={[styles.backIconButton, { top: 16 + insets.top }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        {/* Botón favorito posicionado sobre la foto */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            style={[styles.favoriteIconButton, { top: 16 + insets.top }]}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Animated.View style={animatedHeartStyle}>
              <Ionicons
                name={isFavorite(motel.id) ? 'heart' : 'heart-outline'}
                size={28}
                color="COLORS.primary"
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
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
              <Ionicons name="call" size={20} color="COLORS.primary" />
            </TouchableOpacity>
          )}
          {motel.contact?.whatsapp && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleWhatsApp(motel.contact.whatsapp)}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
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
            backgroundColor: 'COLORS.primary',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
          },
          tabBarActiveTintColor: 'COLORS.primary',
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
  },
  motelPhoto: {
    width: SCREEN_WIDTH,
    height: 240,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  photoIndicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  photoIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  badgesContainer: {
    position: 'absolute',
    right: 16,
    gap: 8,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'COLORS.primary',
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
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
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
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  backIconButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIconButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
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
    backgroundColor: 'COLORS.primary',
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
