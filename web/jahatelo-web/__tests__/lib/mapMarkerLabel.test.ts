import { markerLabelPath } from '@/lib/mapMarkerLabel';

describe('markerLabelPath', () => {
  it.each(['Éxtasis', 'Ñemby', "Motel Q'OTRO", 'Huellas de Amor 2'])(
    'convierte %s a trazos SVG legibles',
    (label) => {
      const result = markerLabelPath(label);
      expect(result.width).toBeGreaterThan(20);
      expect(result.pathData).toMatch(/^M/);
      expect(result.pathData).not.toContain('<text');
    },
  );
});

