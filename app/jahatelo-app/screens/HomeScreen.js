import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchMotels, fetchFeaturedMotels } from '../services/motelsApi';
import { clearStoredStagingCredentials, isStagingEnvironment } from '../services/stagingAuthService';

import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import HomeHeader from '../components/HomeHeader';
import PromoCarousel from '../components/PromoCarousel';
import AdPopup from '../components/AdPopup';
import AdDetailModal from '../components/AdDetailModal';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [motels, setMotels] = useState([]);
  const [featuredMotels, setFeaturedMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);

  // Cargar anuncios
  const { ads: popupAds, trackAdEvent: trackPopupEvent } = useAdvertisements('POPUP_HOME');
  const { ads: bannerAds, trackAdEvent: trackBannerEvent } = useAdvertisements('CAROUSEL');

  const loadMotels = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      // Cargar en paralelo y tolerar fallo parcial de destacados.
      const [motelsResult, featuredResult] = await Promise.allSettled([
        fetchMotels(),
        fetchFeaturedMotels(),
      ]);

      if (motelsResult.status !== 'fulfilled') {
        throw motelsResult.reason || new Error('Error al cargar moteles');
      }

      const data = motelsResult.value || [];
      const featured =
        featuredResult.status === 'fulfilled'
          ? (featuredResult.value || [])
          : [];

      setMotels(data);
      setFeaturedMotels(featured);
    } catch (err) {
      console.error('Error al cargar moteles:', err);
      const errorMessage = err.message || 'Error al cargar moteles';
      setError(errorMessage);

      // Si es error 401 en staging, limpiar credenciales y mostrar alerta
      if (isStagingEnvironment() && errorMessage.includes('401')) {
        console.warn('⚠️ [HomeScreen] Error 401 - Limpiando credenciales inválidas');
        await clearStoredStagingCredentials();

        Alert.alert(
          'Credenciales inválidas',
          'Las credenciales de staging no son válidas. Por favor, reinicia la app e ingresa nuevamente.',
          [
            {
              text: 'Entendido',
              style: 'default'
            }
          ]
        );
      }
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMotels();
  }, []);

  // Mostrar popup de anuncio si hay disponibles (después de 1 segundo)
  useEffect(() => {
    if (popupAds.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setShowAdPopup(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [popupAds, loading]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMotels(true);
  };

  const navigateList = (title, list, listType) => {
    navigation.navigate('MotelList', { title, motels: list, listType });
  };

  const handleCitiesPress = () => {
    navigation.navigate('CitySelector', { motels });
  };

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  };

  const handleSearch = (query = '') => {
    navigation.navigate('Search', { initialQuery: query });
  };

  const handleMapPress = () => {
    navigation.navigate('Map');
  };

  const handleAdClick = (ad) => {
    // Abrir modal con detalles del anuncio
    setSelectedAd(ad);
    setShowAdDetailModal(true);
  };

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', iconName: 'location-outline', onPress: handleCitiesPress },
    { id: 'map', label: 'Ver mapa', iconName: 'map-outline', onPress: handleMapPress },
    { id: 'promos', label: 'Promos', iconName: 'pricetag', onPress: () => navigateList('Promos', promos, 'promos') },
  ];

  const promos = useMemo(() => motels.filter((motel) => motel.tienePromo), [motels]);
  // featuredMotels viene de fetchFeaturedMotels() con featured=true&limit=50
  // para no perder destacados que no caigan en el top-20 de la lista general

  if (loading && !refreshing) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <View style={[styles.centerContainer, { backgroundColor: colors.primary }]}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={[styles.centerText, { color: colors.white }]}>Cargando moteles...</Text>
          </View>
        </View>
      </>
    );
  }

  if (error && !refreshing) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <View style={[styles.centerContainer, { backgroundColor: colors.primary, padding: 24 }]}>
            <Text style={[styles.errorIcon, { color: colors.white }]}>⚠️</Text>
            <Text style={[styles.errorTitle, { color: colors.white }]}>Error de conexión</Text>
            <Text style={[styles.errorMessage, { color: colors.white, opacity: 0.9 }]}>{error}</Text>
            <Text style={[styles.errorHint, { color: colors.white, opacity: 0.7 }]}>
              Verifica tu conexión a internet o las credenciales de staging
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.white }]}
              onPress={() => loadMotels(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryButtonText, { color: colors.primary }]}>🔄 Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Empty state: API funcionó pero no hay moteles
  if (!loading && !error && motels.length === 0) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <View style={[styles.headerWrapper, { backgroundColor: colors.primary }]}>
            <HomeHeader
              motels={motels}
              onMotelPress={handleMotelPress}
              onSearch={handleSearch}
              navigation={navigation}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Mostrar carrusel de publicidades aunque no haya moteles */}
            {bannerAds.length > 0 && (
              <PromoCarousel
                promos={[]}
                ads={bannerAds}
                onPromoPress={handleMotelPress}
                onAdClick={handleAdClick}
                onAdView={trackBannerEvent}
                title="Anuncios"
                badgeLabel=""
                badgeIconName=""
              />
            )}

            {/* Mensaje de empty state */}
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.emptyIcon]}>🏨</Text>
              <Text style={[styles.emptyTitle, { color: colors.primary }]}>No hay moteles disponibles</Text>
              <Text style={[styles.emptyMessage, { color: colors.text }]}>
                Próximamente agregaremos establecimientos en tu zona
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => loadMotels(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyButtonText, { color: colors.white }]}>🔄 Actualizar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Popup publicitario */}
          {popupAds.length > 0 && (
            <AdPopup
              ad={popupAds[0]}
              visible={showAdPopup}
              onClose={() => setShowAdPopup(false)}
              onTrackView={trackPopupEvent}
              onTrackClick={trackPopupEvent}
            />
          )}

          {/* Modal de detalle de anuncio del carrusel */}
          <AdDetailModal
            visible={showAdDetailModal}
            ad={selectedAd}
            onClose={() => {
              setShowAdDetailModal(false);
              setSelectedAd(null);
            }}
            onTrackClick={trackBannerEvent}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.headerWrapper, { backgroundColor: colors.primary }]}>
          <HomeHeader
            motels={motels}
            onMotelPress={handleMotelPress}
            onSearch={handleSearch}
            navigation={navigation}
          />
        </View>

        {/* ScrollView con contenido */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <PromoCarousel
            promos={featuredMotels}
            ads={bannerAds}
            onPromoPress={handleMotelPress}
            onAdClick={handleAdClick}
            onAdView={trackBannerEvent}
            title="Destacados"
            badgeLabel="DESTACADO"
            badgeIconName="star"
          />

          <HomeCategoriesGrid categories={categories} />
        </ScrollView>

        {/* Popup publicitario */}
        {popupAds.length > 0 && (
          <AdPopup
            ad={popupAds[0]}
            visible={showAdPopup}
            onClose={() => setShowAdPopup(false)}
            onTrackView={trackPopupEvent}
            onTrackClick={trackPopupEvent}
          />
        )}

        {/* Modal de detalle de anuncio del carrusel */}
        <AdDetailModal
          visible={showAdDetailModal}
          ad={selectedAd}
          onClose={() => {
            setShowAdDetailModal(false);
            setSelectedAd(null);
          }}
          onTrackClick={trackBannerEvent}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerWrapper: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorHint: {
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    marginBottom: 28,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
