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
import { fetchMotels } from '../services/motelsApi';

import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import HomeHeader from '../components/HomeHeader';
import PromoCarousel from '../components/PromoCarousel';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  const navigation = useNavigation();
  const colors = COLORS;
  const [motels, setMotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMotels = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const data = await fetchMotels();
      setMotels(data || []);
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadMotels(true);
  };

  const navigateList = (title, list) => {
    navigation.navigate('MotelList', { title, motels: list });
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

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', iconName: 'location-outline', onPress: handleCitiesPress },
    { id: 'map', label: 'Ver mapa', iconName: 'map-outline', onPress: handleMapPress },
    { id: 'popular', label: 'Populares', iconName: 'flame-outline', onPress: () => navigateList('Populares', motels) },
  ];

  const promos = useMemo(() => motels.filter((motel) => motel.tienePromo), [motels]);

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
          <PromoCarousel promos={promos.length ? promos : motels.slice(0, 5)} onPromoPress={handleMotelPress} />
          <HomeCategoriesGrid categories={categories} />
        </ScrollView>
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
