import { useTheme } from '../contexts/ThemeContext';
import { COLORS, COLORS_DARK } from '../constants/theme';

/**
 * Hook para obtener los colores correctos según el tema actual
 *
 * Uso:
 * const colors = useThemedColors();
 * <View style={{ backgroundColor: colors.background }}>
 */
export function useThemedColors() {
  const { isDark } = useTheme();
  return isDark ? COLORS_DARK : COLORS;
}
