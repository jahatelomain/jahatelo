export type PublicMotelListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  location: { lat: number; lng: number } | null;
  rating: { average: number; count: number };
  isFeatured: boolean;
  hasPromo: boolean;
  tienePromo: boolean;
  startingPrice: number | null;
  startingPriceWeekday: number | null;
  startingPriceWeekend: number | null;
  amenities: Array<{ name: string; icon: string | null }>;
  thumbnail: string | null;
  featuredPhoto: string | null;
  featuredPhotoWeb?: string | null;
  logoUrl: string | null;
  promoImageUrl: string | null;
  promoTitle: string | null;
  promoDescription: string | null;
  plan: 'FREE' | 'BASIC' | 'GOLD' | 'DIAMOND' | null;
  updatedAt: string;
};

export type PublicMotelListResponse = {
  data: PublicMotelListItem[];
  meta: { page: number; limit: number; total: number; latestUpdatedAt: number };
};
