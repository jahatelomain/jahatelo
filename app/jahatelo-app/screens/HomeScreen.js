import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useOnlineRetry } from '../hooks/useOnlineRetry';
import {
  AppState,
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
import { showMessage } from '../utils/appFeedback';

import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import HomeHeader from '../components/HomeHeader';
import PromoCarousel from '../components/PromoCarousel';
import AdPopup from '../components/AdPopup';
import AdDetailModal from '../components/AdDetailModal';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { claimHomeRotation, newHomeVisitId } from '../services/homeRotationService';
import { COLORS } from '../constants/theme';
import LoadingScreen from '../components/LoadingScreen';

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colors = COLORS;
  const [motels, setMotels] = useState([]);
  const [featuredMotels, setFeaturedMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [popupSlides, setPopupSlides] = useState(null);
  const [featuredSlides, setFeaturedSlides] = useState(null);
  const [visitSequence, setVisitSequence] = useState(0);
  const visitId = useRef(null);
  const isMounted = useRef(false);
  const popupStarted = useRef(false);
  const featuredStarted = useRef(false);
  const popupShownVisit = useRef(-1);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdDetailModal, setShowAdDetailModal] = useState(false);

  // Cargar anuncios
  const { ads: popupAds, loading: popupAdsLoading, trackAdEvent: trackPopupEvent } = useAdvertisements('POPUP_HOME');
  const { ads: bannerAds, loading: bannerAdsLoading, trackAdEvent: trackBannerEvent } = useAdvertisements('CAROUSEL');
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  // A retained Home tab is not remounted when the app returns from background.
  // Claim a new turn on focus after that foreground transition.
  useEffect(() => {
    let wasBackground = AppState.currentState === 'background';
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') wasBackground = true;
      if (nextState === 'active' && wasBackground) {
        wasBackground = false;
        visitId.current = newHomeVisitId();
        popupStarted.current = false;
        featuredStarted.current = false;
        setShowAdPopup(false);
        setPopupSlides(null);
        setFeaturedSlides(null);
        setVisitSequence((current) => current + 1);
      }
    });
    return () => subscription.remove();
  }, []);
  const orderedPopupAds = useMemo(() => {
    if (!popupSlides) return [];
    const byId = new Map(popupAds.map((ad) => [ad.id, ad]));
    return popupSlides.map((slide) => byId.get(slide.id)).filter(Boolean);
  }, [popupSlides, popupAds]);

  useEffect(() => {
    if (!isFocused || loading || popupAdsLoading || popupStarted.current) return;
    popupStarted.current = true;
    if (!popupAds.length) { setPopupSlides([]); return; }
    visitId.current ||= newHomeVisitId();
    const currentVisitId = visitId.current;
    claimHomeRotation('POPUP_HOME', currentVisitId)
      .then((slides) => { if (isMounted.current && visitId.current === currentVisitId) setPopupSlides(slides); })
      .catch((err) => {
        console.warn('Popup rotation unavailable:', err);
        if (isMounted.current && visitId.current === currentVisitId) setPopupSlides([...popupAds].sort((a, b) => a.id.localeCompare(b.id)).map((ad) => ({ kind: 'ad', id: ad.id })));
      });
  }, [isFocused, loading, popupAdsLoading, popupAds, visitSequence]);

  useEffect(() => {
    if (!isFocused || loading || bannerAdsLoading || featuredStarted.current) return;
    featuredStarted.current = true;
    if (!featuredMotels.length && !bannerAds.length) { setFeaturedSlides([]); return; }
    visitId.current ||= newHomeVisitId();
    const currentVisitId = visitId.current;
    claimHomeRotation('FEATURED_HOME', currentVisitId)
      .then((slides) => { if (isMounted.current && visitId.current === currentVisitId) setFeaturedSlides(slides); })
      .catch((err) => {
        console.warn('Featured rotation unavailable:', err);
        if (isMounted.current && visitId.current === currentVisitId) setFeaturedSlides([
          ...featuredMotels.map((motel) => ({ kind: 'motel', id: motel.id })),
          ...(bannerAds[0] ? [{ kind: 'ad', id: bannerAds[0].id }] : []),
        ]);
      });
  }, [isFocused, loading, bannerAdsLoading, featuredMotels, bannerAds, visitSequence]);

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

        showMessage(
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

  // Retry automático al reconectar a internet
  const handleReconnect = useCallback(() => {
    if (error) loadMotels();
  }, [error]);
  useOnlineRetry(handleReconnect);

  // Show the assigned popup at most once per app visit, when Home is visible.
  useEffect(() => {
    if (!isFocused) {
      setShowAdPopup(false);
      return;
    }
    if (orderedPopupAds.length > 0 && !loading && popupShownVisit.current !== visitSequence) {
      const timer = setTimeout(() => {
        popupShownVisit.current = visitSequence;
        setShowAdPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderedPopupAds.length, loading, isFocused, visitSequence]);

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
    return <LoadingScreen message="Cargando moteles" />;
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
                key={visitSequence}
                promos={[]}
                ads={bannerAds}
                slides={featuredSlides}
                onPromoPress={handleMotelPress}
                onAdClick={handleAdClick}
                onAdView={(id) => trackBannerEvent(id, 'VIEW')}
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
          {orderedPopupAds.length > 0 && (
            <AdPopup
              key={visitSequence}
              ads={orderedPopupAds}
              visible={showAdPopup}
              onClose={() => setShowAdPopup(false)}
              onTrackView={(id) => trackPopupEvent(id, 'VIEW')}
              onTrackClick={(id) => trackPopupEvent(id, 'CLICK')}
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
            key={visitSequence}
            promos={featuredMotels}
            ads={bannerAds}
            slides={featuredSlides}
            onPromoPress={handleMotelPress}
            onAdClick={handleAdClick}
            onAdView={(id) => trackBannerEvent(id, 'VIEW')}
            title="Destacados"
            badgeLabel="DESTACADO"
            badgeIconName="star"
          />

          <HomeCategoriesGrid categories={categories} />
        </ScrollView>

        {/* Popup publicitario */}
        {orderedPopupAds.length > 0 && (
          <AdPopup
            key={visitSequence}
            ads={orderedPopupAds}
            visible={showAdPopup}
            onClose={() => setShowAdPopup(false)}
            onTrackView={(id) => trackPopupEvent(id, 'VIEW')}
            onTrackClick={(id) => trackPopupEvent(id, 'CLICK')}
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
