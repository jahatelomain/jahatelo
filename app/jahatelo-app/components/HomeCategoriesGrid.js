import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import HomeCategoryCard from './HomeCategoryCard';

const COLORS = {
  text: '#2E0338',
  card: '#FFFFFF',
  shadow: '#000000',
};

const SOCIAL_ICONS = ['logo-instagram', 'logo-facebook', 'logo-whatsapp', 'logo-tiktok'];

const PartnerLogo = ({ iconName, index }) => (
  <Animated.View entering={FadeInDown.delay(400 + index * 100).duration(600).springify()}>
    <View style={styles.logoCircle}>
      <Ionicons name={iconName} size={20} color={COLORS.text} />
    </View>
  </Animated.View>
);

export default function HomeCategoriesGrid({ categories = [] }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <HomeCategoryCard label={item.label} iconName={item.iconName} onPress={item.onPress} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
      <View style={styles.partnersContainer}>
        <Text style={styles.partnersTitle}>¡Encontranos!</Text>
        <View style={styles.logosRow}>
          {SOCIAL_ICONS.map((icon, index) => (
            <PartnerLogo key={icon} iconName={icon} index={index} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  grid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  partnersContainer: {
    marginTop: 8,
  },
  partnersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginHorizontal: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
