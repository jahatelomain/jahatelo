/* global describe, expect, it, jest */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MotelTabBar from '../MotelTabBar';

const tabs = [
  { key: 'details', name: 'Detalles' },
  { key: 'rooms', name: 'Habitaciones' },
  { key: 'reviews', name: 'Reseñas' },
];

describe('MotelTabBar', () => {
  it('cambia a la tab seleccionada y marca la activa', async () => {
    const onTabPress = jest.fn();
    const { getByRole, getByText } = await render(
      <MotelTabBar tabs={tabs} activeTab="Detalles" onTabPress={onTabPress} />,
    );

    expect(getByRole('tab', { name: 'Detalles' })).toBeSelected();
    await fireEvent.press(getByText('Habitaciones'));
    expect(onTabPress).toHaveBeenCalledWith('Habitaciones');
  });
});
