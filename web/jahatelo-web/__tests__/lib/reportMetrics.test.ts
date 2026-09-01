import { calculateReportMetrics } from '@/lib/reportMetrics';

describe('calculateReportMetrics', () => {
  it('calcula resolución y detecta moteles recurrentes', () => {
    const metrics = calculateReportMetrics([
      { createdAt: new Date('2026-08-01T00:00:00Z'), resolvedAt: new Date('2026-08-02T00:00:00Z'), status: 'RESOLVED', reason: 'PRICE', motel: { id: 'a', name: 'Motel A' } },
      { createdAt: new Date('2026-08-03T00:00:00Z'), resolvedAt: new Date('2026-08-05T00:00:00Z'), status: 'DISMISSED', reason: 'PHOTO', motel: { id: 'a', name: 'Motel A' } },
      { createdAt: new Date('2026-08-04T00:00:00Z'), resolvedAt: null, status: 'PENDING', reason: 'PRICE', motel: { id: 'b', name: 'Motel B' } },
    ]);

    expect(metrics).toMatchObject({ total: 3, open: 1, closed: 2, averageResolutionHours: 36 });
    expect(metrics.recurrentMotels).toEqual([{ motelId: 'a', motelName: 'Motel A', reports: 2, open: 0 }]);
    expect(metrics.byReason[0]).toEqual({ reason: 'PRICE', count: 2 });
  });

  it('no inventa un promedio si aún no hay reportes resueltos', () => {
    expect(calculateReportMetrics([]).averageResolutionHours).toBeNull();
  });
});
