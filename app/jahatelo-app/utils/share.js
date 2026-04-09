import { Share, Platform } from 'react-native';

const BASE_WEB_URL = 'https://jahatelo.com';

/**
 * Compartir motel
 * @param {object} motel - Datos del motel
 * @param {string} motel.slug - Slug del motel (priorizado)
 * @param {string} motel.id - ID del motel (fallback)
 * @param {string} motel.nombre - Nombre del motel
 */
export const shareMotel = async (motel) => {
  if (!motel) return;

  const identifier = motel.slug || motel.id;
  const url = `${BASE_WEB_URL}/motels/${identifier}`;
  const message = `¡Mirá este motel en Jahatelo! ${motel.nombre || ''}`;

  try {
    await Share.share({
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
      title: motel.nombre || 'Motel en Jahatelo',
    });
  } catch (error) {
    console.error('Error al compartir motel:', error);
  }
};

/**
 * Compartir promo/motel destacado
 * @param {object} motel - Datos del motel con promo
 * @param {string} motel.slug - Slug del motel (priorizado)
 * @param {string} motel.id - ID del motel (fallback)
 * @param {string} motel.nombre - Nombre del motel
 * @param {string} promoTitle - Título de la promo (opcional)
 */
export const sharePromo = async (motel, promoTitle) => {
  if (!motel) return;

  const identifier = motel.slug || motel.id;
  const url = `${BASE_WEB_URL}/motels/${identifier}?tab=promos`;
  const promoText = promoTitle ? ` - ${promoTitle}` : '';
  const message = `¡Mirá esta promo en Jahatelo! ${motel.nombre || ''}${promoText}`;

  try {
    await Share.share({
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
      title: `Promo: ${motel.nombre || 'Motel en Jahatelo'}`,
    });
  } catch (error) {
    console.error('Error al compartir promo:', error);
  }
};

/**
 * Compartir habitación específica
 * @param {object} motel - Datos del motel
 * @param {string} motel.slug - Slug del motel (priorizado)
 * @param {string} motel.id - ID del motel (fallback)
 * @param {string} motel.nombre - Nombre del motel
 * @param {object} room - Datos de la habitación
 * @param {string} room.name - Nombre de la habitación
 */
export const shareRoom = async (motel, room) => {
  if (!motel || !room) return;

  const identifier = motel.slug || motel.id;
  const url = `${BASE_WEB_URL}/motels/${identifier}?tab=habitaciones`;
  const message = `¡Mirá esta habitación en Jahatelo! ${room.name || ''} - ${motel.nombre || ''}`;

  try {
    await Share.share({
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
      title: `${room.name || 'Habitación'} - ${motel.nombre || 'Motel en Jahatelo'}`,
    });
  } catch (error) {
    console.error('Error al compartir habitación:', error);
  }
};
