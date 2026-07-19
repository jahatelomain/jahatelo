import { render, screen } from '@testing-library/react';
import FeaturedPhotoDisplay from '@/components/admin/motel-detail/FeaturedPhotoDisplay';

describe('FeaturedPhotoDisplay', () => {
  it('shows both web and app variants', () => {
    render(<FeaturedPhotoDisplay motelName="Motel Demo" webPhoto="/web.jpg" appPhoto="/app.jpg" />);
    expect(screen.getByAltText('Motel Demo - Web')).not.toBeNull();
    expect(screen.getByAltText('Motel Demo - App')).not.toBeNull();
  });

  it('shows an empty state without photos', () => {
    render(<FeaturedPhotoDisplay motelName="Motel Demo" webPhoto={null} appPhoto={null} />);
    expect(screen.getByText('Sin foto principal')).not.toBeNull();
  });
});
