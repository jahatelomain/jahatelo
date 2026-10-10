/* global describe, expect, it, jest */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AdPopup from '../AdPopup';

describe('AdPopup', () => {
  it('shows the assigned first ad and tracks only displayed ads', async () => {
    const onTrackView = jest.fn();
    const onClose = jest.fn();
    const ads = [
      { id: 'ad-b', title: 'Segundo anuncio' },
      { id: 'ad-a', title: 'Primer anuncio' },
    ];
    const screen = await render(<AdPopup ads={ads} visible onClose={onClose} onTrackView={onTrackView} onTrackClick={jest.fn()} />);
    await waitFor(() => expect(onTrackView).toHaveBeenCalledWith('ad-b'));
    expect(onTrackView).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Segundo anuncio')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Anuncio siguiente'));
    await waitFor(() => expect(onTrackView).toHaveBeenCalledWith('ad-a'));
    expect(onTrackView).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Primer anuncio')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Anuncio anterior'));
    expect(onTrackView).toHaveBeenCalledTimes(2);
    await fireEvent.press(screen.getByLabelText('Cerrar anuncio'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await screen.unmount();
  });
});
