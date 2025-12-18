const PRIMARY = '#8B5CF6';
const ACCENT = '#FF8A00';

export const AMENITY_ICON_MAP = {
  Wifi: { name: 'wifi', color: PRIMARY },
  Tv: { name: 'television', color: PRIMARY },
  Monitor: { name: 'monitor', color: PRIMARY },
  Speaker: { name: 'speaker', color: PRIMARY },
  Volume2: { name: 'volume-high', color: PRIMARY },

  Bath: { name: 'bathtub', color: '#00B894' },
  Droplet: { name: 'water', color: '#00B894' },
  Wind: { name: 'weather-windy', color: '#00B894' },
  Flame: { name: 'fire', color: '#FF6B6B' },
  Fan: { name: 'fan', color: '#00B894' },

  Bed: { name: 'bed-queen-outline', color: '#6C5CE7' },
  BedDouble: { name: 'bed', color: '#6C5CE7' },
  Armchair: { name: 'seat', color: '#6C5CE7' },
  Sofa: { name: 'sofa', color: '#6C5CE7' },

  Car: { name: 'car-sports', color: '#0984E3' },
  ParkingCircle: { name: 'parking', color: '#0984E3' },

  Coffee: { name: 'coffee', color: ACCENT },
  Wine: { name: 'glass-wine', color: ACCENT },
  UtensilsCrossed: { name: 'silverware-fork-knife', color: ACCENT },
  Pizza: { name: 'pizza', color: ACCENT },

  Waves: { name: 'pool', color: '#0FB9B1' },
  Heart: { name: 'heart', color: '#FF2E93' },
  Dumbbell: { name: 'dumbbell', color: '#0FB9B1' },
  Sparkles: { name: 'auto-fix', color: '#0FB9B1' },

  Lock: { name: 'lock', color: '#2D3436' },
  ShieldCheck: { name: 'shield-check', color: '#2D3436' },
  Video: { name: 'video-outline', color: '#2D3436' },

  Cigarette: { name: 'cigar', color: '#B2BEC3' },
  CigaretteOff: { name: 'cigar-off', color: '#B2BEC3' },
  Baby: { name: 'baby-face-outline', color: '#B2BEC3' },
  Dog: { name: 'dog', color: '#B2BEC3' },
  Accessibility: { name: 'human', color: '#B2BEC3' },
  Mirror: { name: 'mirror-variant', color: '#B2BEC3' },
  Lamp: { name: 'lamp', color: '#B2BEC3' },
  Star: { name: 'star', color: '#F1C40F' },
};

export const getAmenityIconConfig = (iconKey) => {
  if (!iconKey) return null;
  return AMENITY_ICON_MAP[iconKey] || null;
};
