/* global afterEach, beforeEach, describe, expect, it, jest */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import RoomPhotoGallery from '../RoomPhotoGallery';

jest.mock('../FullscreenPhotoViewer', () => function MockViewer({ visible, onClose }) {
  if (!visible) return null;
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar visor" onPress={onClose}>
      <Text>Visor abierto</Text>
    </Pressable>
  );
});

describe('RoomPhotoGallery', () => {
  beforeEach(() => {
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre y cierra la foto ampliada sin reabrirla', async () => {
    const onStart = jest.fn();
    const onEnd = jest.fn();
    const { getByLabelText, queryByText } = await render(
      <RoomPhotoGallery
        photos={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
        roomName="Suite"
        onHorizontalGestureStart={onStart}
        onHorizontalGestureEnd={onEnd}
      />,
    );

    await fireEvent.press(getByLabelText('Ampliar foto 1 de Suite'));
    expect(queryByText('Visor abierto')).toBeTruthy();
    expect(onStart).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByLabelText('Cerrar visor'));
    expect(queryByText('Visor abierto')).toBeNull();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
