import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
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
    navigation.navigate('MotelDetail', { motelId: motel.id });
  };

  const categories = [
    { id: 'cities', label: 'Moteles por ciudad', iconName: 'location-outline', onPress: handleCitiesPress },
    { id: 'popular', label: 'Populares', iconName: 'flame-outline', onPress: () => navigateList('Populares', motels) },
  ];

  const promos = useMemo(() => motels.filter((motel) => motel.tienePromo), [motels]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Cargando moteles...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.centerText}>⚠️ {error}</Text>
        <Text style={[styles.centerText, { color: COLORS.muted }]}>Verifica tu conexión a internet</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <HomeHeader motels={motels} onMotelPress={handleMotelPress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <PromoCarousel promos={promos.length ? promos : motels.slice(0, 5)} />
        <HomeCategoriesGrid categories={categories} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    backgroundColor: COLORS.white,
    paddingTop: 12,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  centerText: {
    color: COLORS.primary,
    marginTop: 12,
  },
});
