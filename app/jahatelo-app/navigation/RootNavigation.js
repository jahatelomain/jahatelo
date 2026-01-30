import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AgeGateScreen from '../screens/AgeGateScreen';
import BottomTabs from './BottomTabs';
import MotelDetailScreen from '../screens/MotelDetailScreen';
import RegisterMotelScreen from '../screens/RegisterMotelScreen';
import LegalScreen from '../screens/LegalScreen';
import ContactScreen from '../screens/ContactScreen';
import CitySelectorScreen from '../screens/CitySelectorScreen';
import CityMotelsScreen from '../screens/CityMotelsScreen';
import SearchScreen from '../screens/SearchScreen';
import MotelListScreen from '../screens/MotelListScreen';
import MapScreen from '../screens/MapScreen';
import NearbyMotelsScreen from '../screens/NearbyMotelsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  return (
    <Stack.Navigator
      initialRouteName="AgeGate"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AgeGate" component={AgeGateScreen} />
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="MotelList" component={MotelListScreen} />
      <Stack.Screen name="MotelDetail" component={MotelDetailScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="NearbyMotels" component={NearbyMotelsScreen} />
      <Stack.Screen name="RegisterMotel" component={RegisterMotelScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="CitySelector" component={CitySelectorScreen} />
      <Stack.Screen name="CityMotels" component={CityMotelsScreen} />
    </Stack.Navigator>
  );
}
