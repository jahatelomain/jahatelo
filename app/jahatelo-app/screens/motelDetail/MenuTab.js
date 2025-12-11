import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { formatPrice } from '../../services/motelsApi';

export default function MenuTab({ route }) {
  const { motel } = route.params || {};

  if (!motel || !motel.menu || motel.menu.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay menú disponible</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {motel.menu.map((category) => (
        <View key={category.id} style={styles.menuCategory}>
          <Text style={styles.categoryTitle}>{category.title}</Text>

          {category.items && category.items.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
              </View>

              {item.description && (
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              )}
            </View>
          ))}
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
  },
  menuCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A0038',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FF2E93',
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A0038',
    marginLeft: 12,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
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
