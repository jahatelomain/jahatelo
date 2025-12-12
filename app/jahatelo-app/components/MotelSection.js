import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MotelCardSmall from './MotelCardSmall';
import MotelCard from './MotelCard';

const COLORS = {
  white: '#FFFFFF',
  primary: '#FF2E93',
};

export default function MotelSection({
  title,
  data = [],
  ctaText,
  ctaOnPress,
  type = 'small', // 'small' | 'large'
}) {
  const navigation = useNavigation();

  if (!data.length) {
    return null;
  }

  const handleCardPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {ctaText && (
          <TouchableOpacity onPress={ctaOnPress}>
            <Text style={styles.cta}>{ctaText}</Text>
          </TouchableOpacity>
        )}
      </View>

      {type === 'small' ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <MotelCardSmall motel={item} onPress={() => handleCardPress(item)} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {data.map((item) => (
            <View key={item.id || item.slug} style={{ marginBottom: 16 }}>
              <MotelCard motel={item} onPress={() => handleCardPress(item)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  cta: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
