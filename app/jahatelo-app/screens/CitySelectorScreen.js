import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function CitySelectorScreen({ route, navigation }) {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moteles por ciudad</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {citiesData.length} {citiesData.length === 1 ? 'ciudad disponible' : 'ciudades disponibles'}
        </Text>

        <FlatList
          data={citiesData}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cityCard}
              onPress={() => handleCityPress(item)}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="earth-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyText}>No hay ciudades disponibles</Text>
            </View>
          }
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cityCount: {
    fontSize: 13,
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
