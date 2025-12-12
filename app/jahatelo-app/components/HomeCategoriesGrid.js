import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import HomeCategoryCard from './HomeCategoryCard';

const COLORS = {
  text: '#2E0338',
  card: '#FFFFFF',
  shadow: '#000000',
};

const PartnerLogo = () => <View style={styles.logoCircle} />;

export default function HomeCategoriesGrid({ categories = [] }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <HomeCategoryCard label={item.label} iconName={item.iconName} onPress={item.onPress} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
      />
      <View style={styles.partnersContainer}>
        <Text style={styles.partnersTitle}>Aceptamos</Text>
        <View style={styles.logosRow}>
          <PartnerLogo />
          <PartnerLogo />
          <PartnerLogo />
          <PartnerLogo />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  grid: {
    paddingBottom: 16,
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
  },
});
