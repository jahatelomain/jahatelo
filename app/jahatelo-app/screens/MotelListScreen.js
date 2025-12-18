import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import MotelCard from '../components/MotelCard';
import { COLORS } from '../constants/theme';

// Componente wrapper para cada card con animación de entrada escalonada
const AnimatedMotelCard = ({ item, index, onPress }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
      <MotelCard motel={item} onPress={() => onPress(item)} />
    </Animated.View>
  );
};

// Componente de empty state animado
const AnimatedEmptyState = () => {
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(0.5);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      false
    );

    iconOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons name="list-outline" size={64} color={COLORS.muted} />
      </Animated.View>
      <Text style={styles.emptyText}>No hay moteles en esta categoría</Text>
    </View>
  );
};

export default function MotelListScreen({ route, navigation }) {
  const { title, motels = [] } = route.params;

  const handleMotelPress = (motel) => {
    navigation.navigate('MotelDetail', {
      motelSlug: motel.slug,
      motelId: motel.id,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado con animación */}
      <Animated.View entering={SlideInLeft.duration(400).springify()} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Contenido */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(200).duration(500)}>
          <Text style={styles.subtitle}>
            {motels.length} {motels.length === 1 ? 'motel encontrado' : 'moteles encontrados'}
          </Text>
        </Animated.View>

        <FlatList
          data={motels}
          keyExtractor={(item) => item.slug || item.id?.toString()}
          renderItem={({ item, index }) => (
            <AnimatedMotelCard item={item} index={index} onPress={handleMotelPress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<AnimatedEmptyState />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});
