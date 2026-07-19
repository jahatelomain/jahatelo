import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function MotelTabBar({ tabs, activeTab, onTabPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
    >
      {tabs.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabBarContent: {
    paddingHorizontal: 2,
  },
  tabButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
