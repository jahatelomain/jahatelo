import { useEffect, useState, useCallback } from 'react';
import { getApiBase } from '../services/apiBaseUrl';

/**
 * Obtiene la URL base del API
 */
const getApiBaseUrl = () => getApiBase();

/**
 * Hook para manejar anuncios publicitarios
 * @param {string} placement - Ubicación del anuncio (POPUP_HOME, LIST_INLINE, CAROUSEL)
 * @returns {Object} - { ads, loading, error, trackAdEvent }
 */
export function useAdvertisements(placement) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener anuncios de la API
  useEffect(() => {
    let mounted = true;

    const fetchAds = async () => {
      if (!placement) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const baseUrl = getApiBaseUrl();
        const url = `${baseUrl}/advertisements?placement=${placement}&status=ACTIVE`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (mounted) {
          // Filtrar solo anuncios activos y ordenar por prioridad
          const activeAds = (data || [])
            .filter((ad) => ad.status === 'ACTIVE')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

          setAds(activeAds);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Error loading advertisements:', err);
          setError(err.message);
          setAds([]); // No bloquear UI si falla
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAds();

    return () => {
      mounted = false;
    };
  }, [placement]);

  /**
   * Registra un evento de interacción con el anuncio
   * @param {string} adId - ID del anuncio
   * @param {string} eventType - Tipo de evento ('VIEW' o 'CLICK')
   */
  const trackAdEvent = useCallback(async (adId, eventType) => {
    if (!adId || !eventType) {
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/advertisements/track`;

      // Enviar tracking (no esperar respuesta para no bloquear UI)
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertisementId: adId,
          eventType,
        }),
      }).catch((err) => {
        // Log silencioso, no afectar experiencia del usuario
        console.warn('Error tracking ad event:', err);
      });
    } catch (err) {
      console.warn('Error tracking ad event:', err);
    }
  }, []);

  return {
    ads,
    loading,
    error,
    trackAdEvent,
  };
}
