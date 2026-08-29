import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeTabs from './HomeTabs';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favoritos') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen name="Home" component={HomeTabs} options={{ tabBarLabel: 'Inicio', tabBarAccessibilityLabel: 'Inicio' }} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} options={{ tabBarAccessibilityLabel: 'Favoritos' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarAccessibilityLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}
