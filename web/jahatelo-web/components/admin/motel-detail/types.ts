export type MotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MotelAdminTab =
  | 'promos'
  | 'details'
  | 'rooms'
  | 'menu'
  | 'commercial'
  | 'reviews';

export type DayRateForm = {
  price1h: string;
  price1_5h: string;
  price2h: string;
  price3h: string;
  price12h: string;
  price24h: string;
  priceNight: string;
};

export type RoomType = {
  id: string;
  name: string;
  description: string | null;
  order?: number;
  price1h: number | null;
  price1_5h: number | null;
  price2h: number | null;
  price3h: number | null;
  price12h: number | null;
  price24h: number | null;
  priceNight: number | null;
  maxPersons: number | null;
  hasJacuzzi: boolean;
  isFeatured: boolean;
  isActive: boolean;
  amenities: Array<{
    amenity: { id: string; name: string; icon: string | null };
  }>;
  roomPhotos?: Array<{ id: string; url: string; order: number }>;
  dayRates?: Array<{
    dayGroup: 'WEEKDAY' | 'WEEKEND';
    price1h: number | null;
    price1_5h: number | null;
    price2h: number | null;
    price3h: number | null;
    price12h: number | null;
    price24h: number | null;
    priceNight: number | null;
  }>;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

export type MenuCategory = {
  id: string;
  title: string;
  sortOrder: number;
  items: MenuItem[];
};

export type Motel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
  city: string;
  address: string;
  mapUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  status: MotelStatus;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  adminContactName: string | null;
  adminContactEmail: string | null;
  adminContactPhone: string | null;
  operationsContactName: string | null;
  operationsContactEmail: string | null;
  operationsContactPhone: string | null;
  plan: string | null;
  nextBillingAt: string | null;
  isFeatured: boolean;
  featuredPhoto: string | null;
  featuredPhotoWeb?: string | null;
  featuredPhotoApp?: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  createdAt?: string;
  updatedAt?: string;
  rooms?: RoomType[];
  menuCategories?: MenuCategory[];
};

export type Amenity = {
  id: string;
  name: string;
  type: string | null;
  icon: string | null;
};

export type Promo = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isGlobal: boolean;
  hasPromoCode: boolean;
  codeRepeatRule: string | null;
  codeLimit: number | null;
  codeLimitPeriod: string | null;
};

export type PromoCodeEntry = {
  id: string;
  code: string;
  status: 'PENDING' | 'USED';
  deviceId: string;
  createdAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
};

export type RedeemResult =
  | {
      valid: false;
      reason: 'INVALID_CODE' | 'WRONG_PROMO' | 'ALREADY_USED' | 'PROMO_INACTIVE';
      redeemedAt?: string;
    }
  | {
      valid: true;
      codeId?: string;
      promoTitle?: string;
      promoDescription?: string | null;
      promoImageUrl?: string | null;
      confirmed?: boolean;
    };

export type MotelReview = {
  id: string;
  score: number;
  comment: string | null;
  isVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
};
