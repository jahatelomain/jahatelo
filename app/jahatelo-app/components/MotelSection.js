import { useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MotelCard from './MotelCard';
import MotelCardSmall from './MotelCardSmall';

const COLORS = {
  card: '#FFFFFF',
  primary: '#FF2E93',
  text: '#2E0338',
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
    <View style={[styles.container, type === 'small' && styles.cardBackground]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {ctaText && (
          <TouchableOpacity onPress={ctaOnPress} style={styles.ctaButton}>
            <Text style={styles.ctaText}>{ctaText}</Text>
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
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {data.slice(0, 3).map((item) => ( // Mostrar solo 3 en la home
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
  cardBackground: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: '#FCE8EE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
