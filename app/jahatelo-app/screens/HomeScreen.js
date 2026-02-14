import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchMotels, fetchFeaturedMotels } from '../services/motelsApi';

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
      // Cargar en paralelo: lista general (para búsqueda/ciudades/promos) y destacados (para carrusel)
      const [data, featured] = await Promise.all([
        fetchMotels(),
        fetchFeaturedMotels(),
      ]);
      setMotels(data || []);
      setFeaturedMotels(featured || []);
    } catch (err) {
      console.error('Error al cargar moteles:', err);
      setError(err.message || 'Error al cargar moteles');
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
          <View style={[styles.centerContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.centerText, { color: colors.white }]}>⚠️ {error}</Text>
            <Text style={[styles.centerText, { opacity: 0.8, color: colors.white }]}>Verifica tu conexión a internet</Text>
          </View>
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
});
