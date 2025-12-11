import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';

const Tab = createMaterialTopTabNavigator();

export default function HomeTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 12 },
          tabBarIndicatorStyle: { backgroundColor: '#007AFF' },
          tabBarStyle: { backgroundColor: 'white' },
        }}
      >
        <Tab.Screen name="Cerca" component={HomeScreen} />
        <Tab.Screen name="Promos" component={HomeScreen} />
        <Tab.Screen name="Populares" component={HomeScreen} />
        <Tab.Screen name="Premium" component={HomeScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}