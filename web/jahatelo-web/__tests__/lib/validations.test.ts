import {
  AdvertisementSchema,
  BulkIdsSchema,
  MobileMotelsQuerySchema,
} from '@/lib/validations/schemas';

describe('validation schemas', () => {
  it('validates advertisement payloads', () => {
    const payload = {
      title: 'Promo Test',
      advertiser: 'Acme',
      imageUrl: 'https://example.com/image.png',
      largeImageUrl: null,
      description: 'Promo description',
      linkUrl: 'https://example.com',
      placement: 'POPUP_HOME',
      status: 'ACTIVE',
      priority: 5,
      startDate: '2026-01-21T00:00:00.000Z',
      endDate: null,
      maxViews: 100,
      maxClicks: 10,
    };

    expect(() => AdvertisementSchema.parse(payload)).not.toThrow();
  });

  it('rejects empty bulk IDs', () => {
    expect(() => BulkIdsSchema.parse({ ids: [] })).toThrow();
  });

  it('coerces and validates mobile motel query params', () => {
    const query = MobileMotelsQuerySchema.parse({
      search: 'test',
      city: 'Asuncion',
      featured: 'true',
      page: '2',
      limit: '10',
    });

    expect(query.page).toBe(2);
    expect(query.limit).toBe(10);
    expect(query.featured).toBe(true);
  });
});
