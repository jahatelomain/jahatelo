import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigation from './navigation/RootNavigation';

// Prevenir que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Ocultar el splash nativo inmediatamente cuando la app carga
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <NavigationContainer>
            <RootNavigation />
            <OfflineIndicator />
          </NavigationContainer>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
