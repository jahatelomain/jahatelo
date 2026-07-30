import {
  extractCoordinatesFromGoogleMapsUrl,
  normalizeGoogleMapsUrl,
} from '../coordinates';

describe('Google Maps coordinates', () => {
  const embed = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.445080563406!2d-57.53838482378769!3d-25.289246227339!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1" width="600"></iframe>';

  it('normalizes an iframe to its Google Maps src URL', () => {
    expect(normalizeGoogleMapsUrl(embed)).toBe(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.445080563406!2d-57.53838482378769!3d-25.289246227339!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1',
    );
  });

  it('extracts latitude and longitude from a Google Maps embed URL', () => {
    expect(extractCoordinatesFromGoogleMapsUrl(embed)).toEqual({
      lat: -25.289246227339,
      lng: -57.53838482378769,
    });
  });
});
