import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import FullscreenPhotoViewer from './FullscreenPhotoViewer';

export default function RoomPhotoGallery({
  photos,
  roomName,
  onHorizontalGestureStart,
  onHorizontalGestureEnd,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const openPreview = useCallback((index) => {
    setSelectedIndex(index);
    requestAnimationFrame(() => onHorizontalGestureStart?.());
  }, [onHorizontalGestureStart]);

  const closePreview = useCallback(() => {
    setSelectedIndex(null);
    onHorizontalGestureEnd?.();
  }, [onHorizontalGestureEnd]);

  if (!photos?.length) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onTouchStart={onHorizontalGestureStart}
        onTouchEnd={onHorizontalGestureEnd}
        onTouchCancel={onHorizontalGestureEnd}
        onMomentumScrollEnd={onHorizontalGestureEnd}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={`${photo}-${index}`}
            activeOpacity={0.85}
            onPress={() => openPreview(index)}
            accessibilityRole="button"
            accessibilityLabel={`Ampliar foto ${index + 1} de ${roomName}`}
          >
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FullscreenPhotoViewer
        photos={photos}
        visible={selectedIndex !== null}
        initialIndex={selectedIndex ?? 0}
        onClose={closePreview}
        onHorizontalGestureStart={onHorizontalGestureStart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 12,
  },
  scrollContent: {
    paddingRight: 8,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
});
