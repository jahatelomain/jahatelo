import {
  normalizeMediaFields,
  normalizeMotelMedia,
  normalizeMediaUrlForStorage,
} from '@/lib/media/adminMediaUrls';

describe('admin media URL normalization', () => {
  const productionBaseUrl = 'https://www.jahatelo.com';

  it('replaces historical local hosts using the current request origin', () => {
    const result = normalizeMediaFields(
      { imageUrl: 'http://192.168.1.15:3000/uploads/promo.webp' },
      productionBaseUrl,
      ['imageUrl'],
    );

    expect(result.imageUrl).toBe('https://www.jahatelo.com/uploads/promo.webp');
  });

  it('keeps external storage URLs untouched', () => {
    const imageUrl = 'https://bucket.s3.us-east-1.amazonaws.com/uploads/promo.webp';
    expect(normalizeMediaFields({ imageUrl }, productionBaseUrl, ['imageUrl']).imageUrl).toBe(imageUrl);
  });

  it('normalizes motel and nested room/menu media together', () => {
    const motel = normalizeMotelMedia({
      featuredPhoto: 'http://localhost:3000/uploads/cover.webp',
      rooms: [{ roomPhotos: [{ url: 'http://192.168.1.20:3000/uploads/room.webp' }] }],
      promos: [{ imageUrl: 'http://127.0.0.1:3000/uploads/promo.webp' }],
      menuCategories: [{ items: [{ photoUrl: '/uploads/menu.webp' }] }],
    }, productionBaseUrl);

    expect(motel.featuredPhoto).toBe('https://www.jahatelo.com/uploads/cover.webp');
    expect(motel.rooms[0].roomPhotos[0].url).toBe('https://www.jahatelo.com/uploads/room.webp');
    expect(motel.promos[0].imageUrl).toBe('https://www.jahatelo.com/uploads/promo.webp');
    expect(motel.menuCategories[0].items[0].photoUrl).toBe('https://www.jahatelo.com/uploads/menu.webp');
  });

  it('persists legacy local uploads as portable relative paths', () => {
    expect(normalizeMediaUrlForStorage('http://192.168.1.20:3000/uploads/room.webp')).toBe('/uploads/room.webp');
  });
});
