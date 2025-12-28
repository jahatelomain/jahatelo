// Catálogo de iconos disponibles para amenities
// Usando nombres de iconos de Lucide React

export const AMENITY_ICONS = [
  { value: 'Wifi', label: 'WiFi', category: 'tech' },
  { value: 'Tv', label: 'TV', category: 'tech' },
  { value: 'Monitor', label: 'TV Cable/Streaming', category: 'tech' },
  { value: 'Speaker', label: 'Sistema de sonido', category: 'tech' },
  { value: 'Volume2', label: 'Música', category: 'tech' },

  { value: 'Bath', label: 'Jacuzzi/Hidromasaje', category: 'bathroom' },
  { value: 'Droplet', label: 'Ducha', category: 'bathroom' },
  { value: 'Wind', label: 'Aire acondicionado', category: 'climate' },
  { value: 'Flame', label: 'Calefacción', category: 'climate' },
  { value: 'Fan', label: 'Ventilador', category: 'climate' },

  { value: 'Bed', label: 'Cama king/queen', category: 'bedroom' },
  { value: 'BedDouble', label: 'Cama doble', category: 'bedroom' },
  { value: 'Water', label: 'Cama de agua', category: 'bedroom' },
  { value: 'Armchair', label: 'Sala de estar', category: 'bedroom' },
  { value: 'Sofa', label: 'Sofá', category: 'bedroom' },

  { value: 'Car', label: 'Garaje privado', category: 'parking' },
  { value: 'ParkingCircle', label: 'Estacionamiento', category: 'parking' },

  { value: 'Coffee', label: 'Cafetera/Minibar', category: 'food' },
  { value: 'Wine', label: 'Bar', category: 'food' },
  { value: 'UtensilsCrossed', label: 'Room service', category: 'food' },
  { value: 'Pizza', label: 'Menú de comidas', category: 'food' },

  { value: 'Waves', label: 'Piscina', category: 'amenities' },
  { value: 'Heart', label: 'Spa', category: 'amenities' },
  { value: 'Dumbbell', label: 'Gimnasio', category: 'amenities' },
  { value: 'Sparkles', label: 'Sauna', category: 'amenities' },

  { value: 'Lock', label: 'Caja fuerte', category: 'security' },
  { value: 'ShieldCheck', label: 'Seguridad 24hs', category: 'security' },
  { value: 'Video', label: 'Cámaras de seguridad', category: 'security' },

  { value: 'Cigarette', label: 'Zona fumadores', category: 'other' },
  { value: 'CigaretteOff', label: 'No fumadores', category: 'other' },
  { value: 'Baby', label: 'Apto para niños', category: 'other' },
  { value: 'Dog', label: 'Pet friendly', category: 'other' },
  { value: 'Accessibility', label: 'Accesible', category: 'other' },
  { value: 'Mirror', label: 'Espejo grande', category: 'other' },
  { value: 'Lamp', label: 'Iluminación especial', category: 'other' },
  { value: 'Star', label: 'Lujo/Premium', category: 'other' },
] as const;

export type AmenityIconValue = typeof AMENITY_ICONS[number]['value'];

export const ICON_CATEGORIES = {
  tech: 'Tecnología',
  bathroom: 'Baño',
  climate: 'Climatización',
  bedroom: 'Dormitorio',
  parking: 'Estacionamiento',
  food: 'Comida y bebida',
  amenities: 'Amenidades',
  security: 'Seguridad',
  other: 'Otros',
} as const;
