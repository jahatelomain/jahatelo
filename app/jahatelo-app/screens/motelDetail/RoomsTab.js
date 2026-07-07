import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../../services/motelsApi';
import { getAmenityIconConfig } from '../../constants/amenityIcons';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { shareRoom } from '../../utils/share';

// Duraciones a mostrar en el desglose de precios
const DURATIONS = [
  { key: 'price1h',    label: '1h' },
  { key: 'price1_5h',  label: '1.5h' },
  { key: 'price2h',    label: '2h' },
  { key: 'price3h',    label: '3h' },
  { key: 'price12h',   label: '12h' },
  { key: 'price24h',   label: '24h' },
  { key: 'priceNight', label: 'Noche' },
];

/**
 * Retorna true si una habitación tiene precios diferentes entre semana y fin de semana.
 */
function hasDayVariation(dayRates) {
  if (!dayRates || dayRates.length < 2) return false;
  const weekday = dayRates.find((d) => d.dayGroup === 'WEEKDAY');
  const weekend = dayRates.find((d) => d.dayGroup === 'WEEKEND');
  if (!weekday || !weekend) return false;
  return DURATIONS.some(
    ({ key }) => weekday[key] != null && weekend[key] != null && weekday[key] !== weekend[key]
  );
}

/**
 * Fila de precios por duración para un bloque (entre semana o fin de semana).
 */
function PriceRow({ prices }) {
  const entries = DURATIONS.filter(({ key }) => prices[key] != null && prices[key] > 0);
  if (entries.length === 0) return null;
  return (
    <View style={styles.priceGrid}>
      {entries.map(({ key, label }) => (
        <View key={key} style={styles.priceCell}>
          <Text style={styles.priceCellLabel}>{label}</Text>
          <Text style={styles.priceCellValue}>{formatPrice(prices[key])}</Text>
        </View>
      ))}
    </View>
  );
}

function RoomCard({ room, motel }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef(null);

  const handleAmenityLongPress = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setShowTooltip(true);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 3000);
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shareRoom(motel, room);
  }, [motel, room]);

  const amenities = room.amenities || [];

  const amenitiesWithIcon = amenities
    .map((a) => {
      const data = typeof a === 'string' ? { name: a } : a;
      return { name: data.name, iconConfig: getAmenityIconConfig(data.icon) };
    })
    .filter((a) => a.iconConfig);

  const allNames = amenities
    .map((a) => (typeof a === 'string' ? a : a.name))
    .filter(Boolean)
    .join(' · ');

  const dayRates = room.dayRates || [];
  const hasDiff = hasDayVariation(dayRates);
  const weekdayRates = dayRates.find((d) => d.dayGroup === 'WEEKDAY');
  const weekendRates = dayRates.find((d) => d.dayGroup === 'WEEKEND');

  // Determinar si hay precios desglosados que mostrar
  const currentPrices = room.prices || {};
  const hasPriceBreakdown =
    DURATIONS.some(({ key }) => currentPrices[key] != null && currentPrices[key] > 0);

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{room.name}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {room.description && (
        <Text style={styles.roomDescription}>{room.description}</Text>
      )}

      {/* Fotos de la habitación */}
      {room.photos && room.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
          contentContainerStyle={styles.photosScrollContent}
        >
          {room.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.roomPhoto}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Precios */}
      {hasDiff ? (
        // Modo con variación por día de semana
        <View style={styles.dayRatesContainer}>
          {weekdayRates && (
            <View style={styles.dayRateBlock}>
              <View style={styles.dayRateBadge}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
                <Text style={styles.dayRateBadgeText}>Entre semana</Text>
              </View>
              <PriceRow prices={weekdayRates} />
            </View>
          )}
          {weekendRates && (
            <View style={[styles.dayRateBlock, { marginTop: 10 }]}>
              <View style={[styles.dayRateBadge, styles.dayRateBadgeWeekend]}>
                <Ionicons name="sunny-outline" size={12} color="#D97706" />
                <Text style={[styles.dayRateBadgeText, { color: '#D97706' }]}>Fin de semana</Text>
              </View>
              <PriceRow prices={weekendRates} />
            </View>
          )}
        </View>
      ) : hasPriceBreakdown ? (
        // Modo precios simples desglosados por duración
        <View style={styles.dayRatesContainer}>
          <PriceRow prices={currentPrices} />
        </View>
      ) : (
        // Fallback: precio base o label
        <View style={styles.roomPriceRow}>
          {room.priceLabel && room.priceLabel.trim().length > 0 ? (
            <Text style={[styles.roomPriceLabel, { fontWeight: '600' }]}>{room.priceLabel}</Text>
          ) : (
            <>
              <Text style={styles.roomPriceLabel}>DESDE</Text>
              <Text style={styles.roomPrice}>
                {room.basePrice && room.basePrice > 0
                  ? formatPrice(room.basePrice)
                  : 'CONSULTAR'}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Amenities */}
      {amenitiesWithIcon.length > 0 && (
        <View style={styles.amenitiesSection}>
          <View style={styles.amenitiesRow}>
            {amenitiesWithIcon.map((amenity, index) => (
              <TouchableOpacity
                key={index}
                style={styles.amenityCircle}
                onLongPress={handleAmenityLongPress}
                delayLongPress={400}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={amenity.iconConfig.name}
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {showTooltip && (
            <Text style={styles.tooltipText}>{allNames}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function RoomsTab({ route }) {
  const { motel } = route.params || {};

  if (!motel || !motel.rooms || motel.rooms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay habitaciones disponibles</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {motel.rooms.map((room) => (
        <RoomCard key={room.id} room={room} motel={motel} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A0038',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 12,
  },
  roomPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginHorizontal: 6,
  },
  // Precios por duración
  dayRatesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  dayRateBlock: {
    gap: 6,
  },
  dayRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  dayRateBadgeWeekend: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  dayRateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  priceCell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 68,
  },
  priceCellLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceCellValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A0038',
  },
  // Amenities
  amenitiesSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  photosScroll: {
    marginTop: 12,
    marginBottom: 0,
  },
  photosScrollContent: {
    paddingRight: 8,
  },
  roomPhoto: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
