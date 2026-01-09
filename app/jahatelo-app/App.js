import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfflineIndicator from './components/OfflineIndicator';
import { FavoritesProvider } from './hooks/useFavorites';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigation from './navigation/RootNavigation';

export default function App() {
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
