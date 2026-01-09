/**
 * Tema global de la aplicación Jahatelo
 *
 * Todos los colores están centralizados aquí para mantener
 * consistencia visual en toda la aplicación.
 */

// COLORES MODO CLARO
export const COLORS = {
  // Color principal de la marca (lila del splash)
  primary: '#8E2DE2',

  // Variantes del color principal
  primaryLight: '#B27CFF',
  primaryDark: '#6A1FB5',

  // Colores de fondo
  background: '#FFFFFF',
  backgroundDark: '#F8F9FA',

  // Colores de tarjetas y superficies
  card: '#FFFFFF',
  cardBorder: '#F0F0F0',

  // Colores de texto
  text: '#2E0338',
  textLight: '#6A5E6E',
  textMuted: '#9CA3AF',
  muted: '#9CA3AF',

  // Colores de acento
  accent: '#8E2DE2',
  accentLight: '#F0E4FF',
  accentLighter: '#F3E8FF',

  // Colores semánticos
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Colores neutros
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9CA3AF',
  grayLight: '#E5E7EB',
  grayDark: '#4B5563',

  // Overlays y sombras
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  // Colores específicos
  border: '#E5E7EB',
  divider: '#F0F0F0',
  disabled: '#D1D5DB',
};

// COLORES MODO OSCURO
export const COLORS_DARK = {
  // Color principal de la marca
  primary: '#A855F7', // Más claro para mejor contraste en dark

  // Variantes del color principal
  primaryLight: '#C084FC',
  primaryDark: '#9333EA',

  // Colores de fondo
  background: '#0F172A', // slate-900
  backgroundDark: '#1E293B', // slate-800

  // Colores de tarjetas y superficies
  card: '#1E293B',
  cardBorder: '#334155',

  // Colores de texto
  text: '#F1F5F9', // slate-100
  textLight: '#CBD5E1', // slate-300
  textMuted: '#64748B', // slate-500
  muted: '#64748B',

  // Colores de acento
  accent: '#A855F7',
  accentLight: '#312E81',
  accentLighter: '#1E1B4B',

  // Colores semánticos
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Colores neutros
  white: '#FFFFFF',
  black: '#000000',
  gray: '#64748B',
  grayLight: '#475569',
  grayDark: '#94A3B8',

  // Overlays y sombras
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',

  // Colores específicos
  border: '#334155',
  divider: '#334155',
  disabled: '#475569',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
};
