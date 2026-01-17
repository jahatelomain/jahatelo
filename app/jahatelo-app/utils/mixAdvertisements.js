/**
 * Mezcla moteles con anuncios publicitarios
 * Inserta un anuncio cada 5 moteles o al final si hay menos de 5
 *
 * @param {Array} motels - Array de moteles
 * @param {Array} ads - Array de anuncios
 * @returns {Array} Array mezclado con { type: 'motel'|'ad', data: object }
 */
export function mixAdvertisements(motels = [], ads = []) {
  if (!ads || ads.length === 0) {
    return motels.map(motel => ({ type: 'motel', data: motel }));
  }

  const result = [];
  const itemsPerAd = 5;

  motels.forEach((motel, index) => {
    result.push({ type: 'motel', data: motel });

    // Insertar anuncio cada 5 moteles
    if ((index + 1) % itemsPerAd === 0 && ads.length > 0) {
      const adIndex = Math.floor(index / itemsPerAd) % ads.length;
      result.push({ type: 'ad', data: ads[adIndex] });
    }
  });

  // Si no llegamos a 5 moteles, agregar anuncio al final
  if (motels.length < itemsPerAd && ads.length > 0) {
    result.push({ type: 'ad', data: ads[0] });
  }

  return result;
}
