import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../../services/motelsApi';
import { COLORS } from '../../constants/theme';

// Iconos por categoría (fuzzy match por palabras clave)
const getCategoryIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('bebida') || t.includes('trago') || t.includes('drink') || t.includes('alcohol') || t.includes('vino') || t.includes('cerveza')) return 'wine';
  if (t.includes('postre') || t.includes('dulce') || t.includes('torta') || t.includes('helado')) return 'ice-cream';
  if (t.includes('desayuno') || t.includes('mañana')) return 'sunny';
  if (t.includes('snack') || t.includes('picada') || t.includes('entrada') || t.includes('aperitivo')) return 'nutrition';
  if (t.includes('principal') || t.includes('plato') || t.includes('comida') || t.includes('cena')) return 'restaurant';
  if (t.includes('sandwich') || t.includes('burger') || t.includes('hamburgue')) return 'fast-food';
  if (t.includes('pizza')) return 'pizza';
  if (t.includes('ensalada') || t.includes('vegano') || t.includes('vegetarian')) return 'leaf';
  return 'list';
};

export default function MenuTab({ route, refreshing, onRefresh, embedded = false }) {
  const { motel } = route.params || {};
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  if (!motel || !motel.menu || motel.menu.length === 0) {
    const EmptyContainer = embedded ? View : ScrollView;
    return (
      <EmptyContainer
        style={embedded ? styles.emptyContainer : undefined}
        {...(!embedded && {
          contentContainerStyle: styles.emptyContainer,
          refreshControl: <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} colors={[COLORS.primary]} />,
        })}
      >
        <Ionicons name="restaurant-outline" size={56} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>Sin menú disponible</Text>
        <Text style={styles.emptySubtext}>Este motel no tiene menú cargado todavía</Text>
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
      {motel.menu.map((category) => {
        const expanded = expandedCategories.has(category.id);
        const toggleCategory = () => setExpandedCategories((current) => {
          const next = new Set(current);
          if (next.has(category.id)) next.delete(category.id);
          else next.add(category.id);
          return next;
        });
        return (
        <View key={category.id} style={styles.menuCategory}>
          {/* Header de categoría */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={toggleCategory}
            accessibilityRole="button"
            accessibilityLabel={`${category.title}, ${category.items?.length || 0} productos`}
            accessibilityState={{ expanded }}
          >
            <View style={styles.categoryIconContainer}>
              <Ionicons name={getCategoryIcon(category.title)} size={18} color={COLORS.white} />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryCount}>{category.items?.length || 0}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* Items */}
          {expanded && category.items && category.items.length > 0 ? (
            category.items.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.menuItem,
                  idx === category.items.length - 1 && styles.menuItemLast,
                ]}
              >
                <View style={styles.menuItemHeader}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                ) : null}
              </View>
            ))
          ) : expanded ? (
            <Text style={styles.emptyCategoryText}>Sin items en esta categoría</Text>
          ) : null}
        </View>
      )})}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  menuCategory: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayLight || '#F0F0F0',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  categoryCount: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.85,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  menuItemName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 12,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyCategoryText: {
    fontSize: 13,
    color: '#bbb',
    padding: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.white,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
});
