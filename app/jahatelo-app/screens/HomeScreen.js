import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchMotels } from '../services/motelsApi';

import HomeHeader from '../components/HomeHeader';
import PromoCarousel from '../components/PromoCarousel';
import MotelSection from '../components/MotelSection';

const COLORS = {
  background: '#0F0019',
  white: '#FFFFFF',
  muted: '#C5C5C5',
  primary: '#FF2E93',
};

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

  const promos = useMemo(
    () => motels.filter((motel) => motel.tienePromo),
    [motels]
  );

  const populares = useMemo(() => {
    return [...motels]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [motels]);

  const premium = useMemo(
    () => motels.filter((motel) => motel.isFeatured),
    [motels]
  );

  const navigateList = (title) => {
    navigation.navigate('MotelList', { title });
  };

  const renderBanner = () => (
    <TouchableOpacity
      style={styles.bannerContainer}
      activeOpacity={0.85}
      onPress={() => navigateList('Promociones')}
    >
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1559599238-4b9b034d4e9e?auto=format&fit=crop&w=1400&q=80',
        }}
        style={styles.bannerImage}
      >
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Promo destacada</Text>
          <Text style={styles.bannerSubtitle}>¡Escapate hoy y ahorrá!</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

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
        <Text style={[styles.centerText, { color: COLORS.muted }]}>
          Verifica tu conexión a internet
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <HomeHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <PromoCarousel promos={promos} />

        <MotelSection
          title="Populares"
          data={populares}
          ctaText="Ver todos"
          ctaOnPress={() => navigateList('Populares')}
          type="small"
        />

        <MotelSection
          title="Premium"
          data={premium}
          ctaText="Ver todos"
          ctaOnPress={() => navigateList('Premium')}
          type="large"
        />

        {renderBanner()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  centerText: {
    color: COLORS.white,
    marginTop: 12,
  },
  bannerContainer: {
    height: 160,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 18,
    overflow: 'hidden',
  },
  bannerImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerText: {
    padding: 16,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: COLORS.muted,
    marginTop: 4,
  },
});
