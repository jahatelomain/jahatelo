type MotelSchemaInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  url?: string | null;
  priceRange?: string | null;
  amenities?: Array<{ name: string }> | null;
};

export function generateMotelSchema(motel: MotelSchemaInput) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': motel.url ? `${motel.url}#business` : undefined,
    name: motel.name,
    description: motel.description || undefined,
    image: motel.image || undefined,
    url: motel.url || undefined,
    telephone: motel.phone || motel.whatsapp || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: motel.neighborhood || motel.address || undefined,
      addressLocality: motel.city || undefined,
      addressRegion: 'Paraguay',
      addressCountry: motel.country || 'PY',
    },
  };

  if (motel.latitude && motel.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: motel.latitude,
      longitude: motel.longitude,
    };
  }

  if (motel.ratingCount && motel.ratingCount > 0 && motel.ratingAvg) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: motel.ratingAvg.toFixed(1),
      reviewCount: motel.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (motel.priceRange) {
    schema.priceRange = motel.priceRange;
  }

  if (motel.amenities && motel.amenities.length > 0) {
    schema.amenityFeature = motel.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a.name,
    }));
  }

  return schema;
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jahatelo',
    url: baseUrl,
    logo: `${baseUrl}/logo-icon.png`,
  };
}

export function generateWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: 'Jahatelo',
    description: 'Encuentra los mejores moteles en Paraguay',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  user: {
    name?: string | null;
    email: string;
  };
  createdAt: Date;
};

export function generateReviewsSchema(motelUrl: string, reviews: Review[]) {
  if (!reviews || reviews.length === 0) return null;

  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'LodgingBusiness',
      '@id': `${motelUrl}#business`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: review.user.name || review.user.email.split('@')[0],
    },
    reviewBody: review.comment || undefined,
    datePublished: review.createdAt.toISOString(),
  }));
}

export function generateCityCollectionSchema(city: string, motelCount: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Moteles en ${city}`,
    description: `Encuentra los mejores moteles en ${city}, Paraguay. ${motelCount} opciones disponibles.`,
    url: `${baseUrl}/ciudad/${encodeURIComponent(city.toLowerCase())}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: motelCount,
      itemListElement: [], // Se puede agregar los moteles individuales si se desea
    },
  };
}

export function generateNeighborhoodCollectionSchema(
  city: string,
  neighborhood: string,
  motelCount: number
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Moteles en ${neighborhood}, ${city}`,
    description: `Encuentra los mejores moteles en ${neighborhood}, ${city}, Paraguay. ${motelCount} opciones disponibles.`,
    url: `${baseUrl}/ciudad/${encodeURIComponent(city.toLowerCase())}/${encodeURIComponent(neighborhood.toLowerCase())}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: motelCount,
      itemListElement: [],
    },
  };
}
