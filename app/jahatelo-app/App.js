import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import RootNavigation from './navigation/RootNavigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <RootNavigation />
          <OfflineIndicator />
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
