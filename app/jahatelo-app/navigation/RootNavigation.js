import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import AgeGateScreen from '../screens/AgeGateScreen';
import BottomTabs from './BottomTabs';
import MotelDetailScreen from '../screens/MotelDetailScreen';
import RegisterMotelScreen from '../screens/RegisterMotelScreen';
import LegalScreen from '../screens/LegalScreen';

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
      <Stack.Screen name="MotelDetail" component={MotelDetailScreen} />
      <Stack.Screen name="RegisterMotel" component={RegisterMotelScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}
