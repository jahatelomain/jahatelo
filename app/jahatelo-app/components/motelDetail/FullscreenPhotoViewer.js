import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FullscreenPhotoViewer({
  photos,
  visible,
  initialIndex,
  onClose,
  onHorizontalGestureStart,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const listRef = useRef(null);
  const visibleRef = useRef(visible);

  visibleRef.current = visible;

  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  const scrollToInitialPhoto = () => {
    listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={scrollToInitialPhoto}
    >
      <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onTouchStart={onHorizontalGestureStart}
          removeClippedSubviews={false}
          initialNumToRender={photos.length || 1}
          maxToRenderPerBatch={photos.length || 1}
          windowSize={Math.max(3, (photos.length || 1) * 2 + 1)}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(photo, index) => `${photo}-${index}`}
          onMomentumScrollEnd={(event) => {
            if (!visibleRef.current) return;
            setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar galería"
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.counter}>
          <Text style={styles.counterText}>{currentIndex + 1} / {photos.length}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  counter: {
    position: 'absolute',
    bottom: 38,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
