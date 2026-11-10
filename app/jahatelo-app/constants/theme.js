/**
 * Tema global de la aplicación Jahatelo
 *
 * Todos los colores están centralizados aquí para mantener
 * consistencia visual en toda la aplicación.
 */

// COLORES MODO CLARO (DARK_SURFACES definido en línea 143 pero NO consumido aún — pendiente implementar useTheme hook)
export const COLORS = {
  // Color principal de la marca (lila del splash)
  primary: '#8E2DE2',

  // Variantes del color principal
  primaryLight: '#7C3AED',
  primaryDark: '#6A1FB5',

  // Colores de fondo
  background: '#FFFFFF',
  backgroundDark: '#F8F9FA',
  backgroundSoft: '#F8F5FC',

  // Colores de tarjetas y superficies
  card: '#FFFFFF',
  cardBorder: '#F0F0F0',
  cardBorderSoft: '#ECE4F4',
  inputBorder: '#DDD3E8',
  inputBackground: '#FCFAFE',
  skeleton: '#E0E0E0',

  // Colores de texto
  text: '#2E0338',
  textLight: '#6A5E6E',
  textMuted: '#6B7280',
  muted: '#6B7280',

  // Colores de acento
  accent: '#8E2DE2',
  accentLight: '#F0E4FF',
  accentLighter: '#F3E8FF',

  // Colores semánticos (variantes oscuras para texto sobre fondo blanco ≥4.5:1)
  success: '#047857',
  warning: '#B45309',
  error: '#B91C1C',
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
  surfaceMuted: '#F5F5F5',
  surfaceSubtle: '#F1F5F9',
  surfaceRaised: '#FDFDFD',
  borderMuted: '#E0E0E0',
  borderBrandSoft: '#F0E6F5',
  textBrandDark: '#2A0038',
  textSecondary: '#6A5E6E',
  textTertiary: '#9C8BA5',
  brandSoft: '#F5E6FA',
  brandHighlight: '#FFE4F1',
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

export const SHADOWS = {
  card: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
};

export const TOUCH_TARGET = 44;

export const STATUS_COLORS = {
  successDark: '#047857',
  warningDark: '#B45309',
  errorDark: '#B91C1C',
  whatsapp: '#25D366',
  iosLink: '#007AFF',
  danger: '#DC2626',
  dangerSoft: '#FF6B6B',
  successSurface: '#DCFCE7',
  successText: '#166534',
  warningSurface: '#FEF3C7',
  warningText: '#92400E',
  google: '#DB4437',
  star: '#FFD700',
};

export const PLAN_COLORS = {
  gold: '#F59E0B',
  goldLight: '#FDE68A',
  goldDark: '#D97706',
  goldSoft: '#FBBF24',
  diamond: '#22D3EE',
  diamondLight: '#BAE6FD',
  diamondDark: '#0EA5E9',
  diamondSoft: '#7DD3FC',
};

export const DARK_SURFACES = {
  // Color principal de la marca (lila más vibrante para contraste en dark)
  primary: '#A855F7',
  primaryLight: '#C084FC',
  primaryDark: '#7C3AED',

  // Fondos oscuros
  background: '#0F0A14',
  backgroundDark: '#0A0610',
  backgroundSoft: '#1A1025',

  // Tarjetas y superficies
  card: '#1F0F2E',
  cardBorder: '#2D1B3D',
  cardBorderSoft: '#3D2650',
  inputBorder: '#3D2650',
  inputBackground: '#1A1025',
  skeleton: '#2D1B3D',

  // Textos
  text: '#FFFFFF',
  textLight: '#D4C5E0',
  textMuted: '#9B8DB0',
  muted: '#9B8DB0',

  // Acento
  accent: '#FF2E93',
  accentLight: '#3D1530',
  accentLighter: '#2D1025',

  // Semánticos (ligeramente ajustados para contraste en fondo oscuro)
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Neutros
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9B8DB0',
  grayLight: '#2D1B3D',
  grayDark: '#D4C5E0',

  // Overlays y sombras
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',

  // Bordes y divisores
  border: '#2D1B3D',
  divider: '#2D1B3D',
  disabled: '#3D2650',
  surfaceMuted: '#1A1025',
  surfaceSubtle: '#150D1E',
  surfaceRaised: '#251535',
  borderMuted: '#2D1B3D',
  borderBrandSoft: '#3D2650',
  textBrandDark: '#E9D5FF',
  textSecondary: '#D4C5E0',
  textTertiary: '#9B8DB0',
  brandSoft: '#2D1535',
  brandHighlight: '#3D1530',
};

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
  TOUCH_TARGET,
  STATUS_COLORS,
  PLAN_COLORS,
  DARK_SURFACES,
};
