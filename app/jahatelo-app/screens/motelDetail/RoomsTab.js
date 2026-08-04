import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../../services/motelsApi';
import { getAmenityIconConfig } from '../../constants/amenityIcons';
import { COLORS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { shareRoom } from '../../utils/share';
import RoomPhotoGallery from '../../components/motelDetail/RoomPhotoGallery';

// Duraciones a mostrar en el desglose de precios
const DURATIONS = [
  { key: 'price1h',    label: '1h' },
  { key: 'price1_5h',  label: '1.5h' },
  { key: 'price2h',    label: '2h' },
  { key: 'price3h',    label: '3h' },
  { key: 'price12h',   label: '12h' },
  { key: 'price24h',   label: '24h' },
  { key: 'priceNight', label: 'Dormida' },
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

const WEEKDAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEKDAY_LABELS = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié', THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom' };
const DURATION_LABELS = { H1: '1h', H1_5: '1.5h', H2: '2h', H3: '3h', H12: '12h', H24: '24h', NIGHT: 'Dormida' };

function SpecificDayRates({ rates }) {
  if (!Array.isArray(rates) || rates.length === 0) return null;
  const grouped = rates.reduce((items, rate) => {
    const key = `${rate.duration}:${rate.price}`;
    if (!items[key]) items[key] = { ...rate, weekdays: [] };
    items[key].weekdays.push(rate.weekday);
    return items;
  }, {});
  const sortedRates = Object.values(grouped).map((rate) => ({
    ...rate,
    weekdays: rate.weekdays.sort((first, second) => WEEKDAY_ORDER.indexOf(first) - WEEKDAY_ORDER.indexOf(second)),
  })).sort((first, second) => WEEKDAY_ORDER.indexOf(first.weekdays[0]) - WEEKDAY_ORDER.indexOf(second.weekdays[0]));
  return <View style={styles.specificRates}>{sortedRates.map((rate) => (
    <View key={`${rate.duration}-${rate.price}`} style={styles.specificRateRow}>
      <Text style={styles.specificRateDays}>{rate.weekdays.map((day) => WEEKDAY_LABELS[day] || day).join(', ')}</Text>
      <Text style={styles.specificRateValue}>{DURATION_LABELS[rate.duration] || rate.duration} · {formatPrice(rate.price)}</Text>
    </View>
  ))}</View>;
}

function RoomCard({ room, motel, onPhotoGestureStart, onPhotoGestureEnd }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef(null);

  const handleAmenityLongPress = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setShowTooltip(true);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 6000);
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shareRoom(motel, room);
  }, [motel, room]);

  const amenities = (Array.isArray(room.amenities) ? room.amenities : []).filter(Boolean);

  const amenitiesWithIcon = amenities
    .map((a) => {
      const data = typeof a === 'string' ? { name: a } : a;
      return { name: data.name, iconConfig: getAmenityIconConfig(data.icon) };
    })
    .filter((a) => a.name && a.iconConfig);

  const allNames = amenities
    .map((a) => (typeof a === 'string' ? a : a?.name))
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
      <RoomPhotoGallery
        photos={room.photos || []}
        roomName={room.name}
        onHorizontalGestureStart={onPhotoGestureStart}
        onHorizontalGestureEnd={onPhotoGestureEnd}
      />

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
        // Sin tarifas configuradas
        <View style={styles.roomPriceRow}>
          <Text style={styles.roomPrice}>CONSULTAR</Text>
        </View>
      )}
      <SpecificDayRates rates={room.weekdayRates} />

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

export default function RoomsTab({
  route,
  onChildHorizontalGestureStart,
  onChildHorizontalGestureEnd,
  refreshing,
  onRefresh,
  embedded = false,
}) {
  const { motel } = route.params || {};

  if (!motel || !motel.rooms || motel.rooms.length === 0) {
    const EmptyContainer = embedded ? View : ScrollView;
    return (
      <EmptyContainer
        style={embedded ? styles.emptyContainer : undefined}
        {...(!embedded && {
          contentContainerStyle: styles.emptyContainer,
          refreshControl: <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[COLORS.primary]} />,
        })}
      >
        <Text style={styles.emptyText}>No hay habitaciones disponibles</Text>
      </EmptyContainer>
    );
  }

  const Container = embedded ? View : ScrollView;
  return (
    <Container
      style={embedded ? styles.content : styles.container}
      {...(!embedded && {
        contentContainerStyle: styles.content,
        refreshControl: <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[COLORS.primary]} />,
      })}
    >
      {motel.rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          motel={motel}
          onPhotoGestureStart={onChildHorizontalGestureStart}
          onPhotoGestureEnd={onChildHorizontalGestureEnd}
        />
      ))}
    </Container>
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
  specificRates: { marginTop: 8, gap: 5 },
  specificRateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, backgroundColor: '#F4F0FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  specificRateDays: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  specificRateValue: { fontSize: 11, fontWeight: '700', color: '#333' },
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
