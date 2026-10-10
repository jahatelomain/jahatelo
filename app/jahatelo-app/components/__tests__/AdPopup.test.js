/* global describe, expect, it, jest */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import AdPopup from '../AdPopup';

describe('AdPopup', () => {
  it('shows the assigned first ad, navigates to the rest, and tracks only displayed ads', async () => {
    const onTrackView = jest.fn();
    const onClose = jest.fn();
    const ads = [
      { id: 'ad-b', title: 'Segundo anuncio' },
      { id: 'ad-a', title: 'Primer anuncio' },
    ];
    let tree;
    await act(async () => {
      tree = create(<AdPopup ads={ads} visible onClose={onClose} onTrackView={onTrackView} onTrackClick={jest.fn()} />);
    });
    const hasText = (text) => tree.root.findAllByType(Text).some((node) => node.props.children === text);
    const press = async (label) => {
      await act(async () => tree.root.findByProps({ accessibilityLabel: label }).props.onPress());
    };

    expect(hasText('Segundo anuncio')).toBe(true);
    expect(onTrackView).toHaveBeenCalledTimes(1);
    expect(onTrackView).toHaveBeenCalledWith('ad-b');

    await press('Anuncio siguiente');
    expect(hasText('Primer anuncio')).toBe(true);
    expect(onTrackView).toHaveBeenCalledTimes(2);
    expect(onTrackView).toHaveBeenCalledWith('ad-a');

    await press('Anuncio anterior');
    expect(onTrackView).toHaveBeenCalledTimes(2);
    await press('Cerrar anuncio');
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => tree.unmount());
  });
});
