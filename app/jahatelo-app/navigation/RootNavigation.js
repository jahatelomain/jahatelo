import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import AgeGateScreen from '../screens/AgeGateScreen';
import BottomTabs from './BottomTabs';
import MotelDetailScreen from '../screens/MotelDetailScreen';
import RegisterMotelScreen from '../screens/RegisterMotelScreen';
import LegalScreen from '../screens/LegalScreen';
import CitySelectorScreen from '../screens/CitySelectorScreen';
import CityMotelsScreen from '../screens/CityMotelsScreen';
import SearchScreen from '../screens/SearchScreen';
import MotelListScreen from '../screens/MotelListScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="AgeGate" component={AgeGateScreen} />
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="MotelList" component={MotelListScreen} />
      <Stack.Screen name="MotelDetail" component={MotelDetailScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="RegisterMotel" component={RegisterMotelScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="CitySelector" component={CitySelectorScreen} />
      <Stack.Screen name="CityMotels" component={CityMotelsScreen} />
    </Stack.Navigator>
  );
}
