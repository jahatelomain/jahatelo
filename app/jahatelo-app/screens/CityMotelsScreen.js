import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MotelCard from '../components/MotelCard';
import AdListItem from '../components/AdListItem';
import { useAdvertisements } from '../hooks/useAdvertisements';
import { mixAdvertisements } from '../utils/mixAdvertisements';
import { COLORS } from '../constants/theme';

export default function CityMotelsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { cityName, motels = [] } = route.params;
  const headerPaddingTop = insets.top + 12;

  // Cargar anuncios de lista
  const { ads: listAds, trackAdEvent } = useAdvertisements('LIST_INLINE');

  // Mezclar moteles con anuncios
  const mixedItems = useMemo(() => {
    return mixAdvertisements(motels, listAds);
  }, [motels, listAds]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header personalizado */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{cityName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {motels.length} {motels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
        </Text>

        <FlatList
          data={mixedItems}
          keyExtractor={(item, index) => `${item.type}-${item.data.id || index}`}
          renderItem={({ item }) => {
            if (item.type === 'ad') {
              return (
                <AdListItem
                  ad={item.data}
                  onAdClick={trackAdEvent}
                  onAdView={trackAdEvent}
                />
              );
            }

            return (
              <MotelCard
                motel={item.data}
                onPress={() => navigation.navigate('MotelDetail', { motelId: item.data.id })}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyText}>No hay moteles en esta ciudad</Text>
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
    backgroundColor: COLORS.white,
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
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
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
