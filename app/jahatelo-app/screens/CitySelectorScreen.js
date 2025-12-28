import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';

// Componente de city card animada
const AnimatedCityCard = ({ item, index, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(500).springify()}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(item);
        }}
        activeOpacity={1}
      >
        <Animated.View style={[styles.cityCard, animatedStyle]}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.cityInfo}>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityCount}>
              {item.count} {item.count === 1 ? 'motel' : 'moteles'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty state animado
const AnimatedEmptyState = () => {
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );

    iconRotation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000 }),
        withTiming(10, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons name="earth-outline" size={64} color={COLORS.muted} />
      </Animated.View>
      <Text style={styles.emptyText}>No hay ciudades disponibles</Text>
    </View>
  );
};

export default function CitySelectorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { motels = [] } = route.params;

  // Agrupar moteles por ciudad
  const citiesData = useMemo(() => {
    const citiesMap = {};

    motels.forEach((motel) => {
      const city = motel.ciudad || motel.city || 'Sin ciudad';
      if (!citiesMap[city]) {
        citiesMap[city] = [];
      }
      citiesMap[city].push(motel);
    });

    // Convertir a array y ordenar alfabéticamente
    return Object.keys(citiesMap)
      .sort()
      .map((cityName) => ({
        name: cityName,
        count: citiesMap[cityName].length,
        motels: citiesMap[cityName],
      }));
  }, [motels]);

  const handleCityPress = (city) => {
    navigation.navigate('CityMotels', {
      cityName: city.name,
      motels: city.motels,
    });
  };

  const headerPaddingTop = insets.top + 12;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header personalizado con animación */}
      <Animated.View
        entering={SlideInLeft.duration(400).springify()}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moteles por ciudad</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Contenido */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(200).duration(500)}>
          <Text style={styles.subtitle}>
            {citiesData.length} {citiesData.length === 1 ? 'ciudad disponible' : 'ciudades disponibles'}
          </Text>
        </Animated.View>

        <FlatList
          data={citiesData}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => (
        <AnimatedCityCard item={item} index={index} onPress={handleCityPress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<AnimatedEmptyState />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cityCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});
