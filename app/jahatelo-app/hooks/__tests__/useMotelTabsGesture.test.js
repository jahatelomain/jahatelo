/* global describe, expect, it */
import { getTabAfterSwipe, shouldCaptureTabSwipe } from '../useMotelTabsGesture';

const tabs = [
  { key: 'details', name: 'Detalles' },
  { key: 'rooms', name: 'Habitaciones' },
  { key: 'reviews', name: 'Reseñas' },
];

describe('reglas del gesto de tabs', () => {
  it('solo captura movimientos claramente horizontales', () => {
    expect(shouldCaptureTabSwipe({ dx: -80, dy: 4 })).toBe(true);
    expect(shouldCaptureTabSwipe({ dx: 12, dy: 2 })).toBe(false);
    expect(shouldCaptureTabSwipe({ dx: 30, dy: 25 })).toBe(false);
  });

  it('avanza y retrocede sin salir de los limites', () => {
    expect(getTabAfterSwipe({
      tabs,
      activeTab: 'Detalles',
      dx: -80,
      vx: -0.5,
    })).toBe('Habitaciones');

    expect(getTabAfterSwipe({
      tabs,
      activeTab: 'Habitaciones',
      dx: 80,
      vx: 0.5,
    })).toBe('Detalles');

    expect(getTabAfterSwipe({
      tabs,
      activeTab: 'Detalles',
      dx: 80,
      vx: 0.5,
    })).toBeNull();
  });
});
