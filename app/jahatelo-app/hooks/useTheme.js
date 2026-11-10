import { useColorScheme } from 'react-native';
import { COLORS, DARK_SURFACES } from '../constants/theme';

/**
 * Hook de tema que resuelve colores según el esquema de color del sistema.
 * Retorna todos los tokens de COLORS en modo claro; en modo oscuro,
 * superpone los tokens definidos en DARK_SURFACES sobre los defaults.
 *
 * Uso: const { colors, isDark } = useTheme();
 */
export default function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = isDark
    ? { ...COLORS, ...DARK_SURFACES }
    : COLORS;

  return { colors, isDark };
}