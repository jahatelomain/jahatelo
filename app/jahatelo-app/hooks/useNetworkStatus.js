import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook personalizado para monitorear el estado de la red
 * @returns {Object} Estado de la red
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Suscribirse a cambios en el estado de la red
    const unsubscribe = NetInfo.addEventListener(state => {
      const reachable = state.isInternetReachable ?? true;

      setIsConnected(state.isConnected);
      setIsInternetReachable(reachable);
      setConnectionType(state.type);

      // Log para debugging
      if (!state.isConnected || !reachable) {
        console.log('📡 Sin conexión a internet');
      } else {
        console.log(`📡 Conectado via ${state.type}`);
      }
    });

    // Obtener estado inicial
    NetInfo.fetch().then(state => {
      const reachable = state.isInternetReachable ?? true;

      setIsConnected(state.isConnected);
      setIsInternetReachable(reachable);
      setConnectionType(state.type);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
    connectionType,
  };
};
