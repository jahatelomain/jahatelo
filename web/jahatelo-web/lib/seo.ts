type MotelSchemaInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  phone?: string | null;
  url?: string | null;
};

export function generateMotelSchema(motel: MotelSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: motel.name,
    description: motel.description || undefined,
    image: motel.image || undefined,
    url: motel.url || undefined,
    telephone: motel.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: motel.address || undefined,
      addressLocality: motel.city || undefined,
      addressCountry: motel.country || undefined,
    },
    aggregateRating:
      motel.ratingCount && motel.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: motel.ratingAvg || 0,
            reviewCount: motel.ratingCount,
          }
        : undefined,
  };
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
