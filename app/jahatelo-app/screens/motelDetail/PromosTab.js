import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function PromosTab({ route }) {
  const { motel } = route.params || {};
  const promos = motel?.promos || [];

  if (!promos.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Sin promociones activas</Text>
        <Text style={styles.emptySubtitle}>
          Cuando este motel publique una promo, la vas a ver acá.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {promos.map((promo) => (
        <View key={promo.id} style={styles.card}>
          {promo.imageUrl ? (
            <Image source={{ uri: promo.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imagePlaceholderText}>Promo</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{promo.title}</Text>
              {promo.isGlobal && (
                <View style={styles.globalBadge}>
                  <Text style={styles.globalBadgeText}>Home</Text>
                </View>
              )}
            </View>
            {promo.description ? (
              <Text style={styles.description}>{promo.description}</Text>
            ) : (
              <Text style={styles.descriptionMuted}>Sin descripción</Text>
            )}
            {(promo.validFrom || promo.validUntil) && (
              <Text style={styles.validity}>
                Vigente {promo.validFrom ? `desde ${new Date(promo.validFrom).toLocaleDateString('es-PY')}` : ''}
                {promo.validUntil ? ` hasta ${new Date(promo.validUntil).toLocaleDateString('es-PY')}` : ''}
              </Text>
            )}
          </View>
        </View>
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
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6A5E6E',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#F0E6F5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: '#F5E6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#9932CC',
    fontWeight: '700',
    fontSize: 16,
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A0038',
    flex: 1,
    marginRight: 12,
  },
  globalBadge: {
    backgroundColor: '#FFE4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  globalBadgeText: {
    color: '#FF2E93',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#4A3E52',
  },
  descriptionMuted: {
    fontSize: 14,
    color: '#9C8BA5',
    fontStyle: 'italic',
  },
  validity: {
    marginTop: 4,
    fontSize: 12,
    color: '#9C8BA5',
  },
});
