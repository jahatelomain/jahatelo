import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from './components/AnimatedSplash';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import RootNavigation from './navigation/RootNavigation';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      {showSplash ? (
        <AnimatedSplash />
      ) : (
        <FavoritesProvider>
          <NavigationContainer>
            <RootNavigation />
            <OfflineIndicator />
          </NavigationContainer>
        </FavoritesProvider>
      )}
    </SafeAreaProvider>
  );
}
