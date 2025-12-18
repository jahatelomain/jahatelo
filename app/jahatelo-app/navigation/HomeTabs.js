import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import { COLORS } from '../constants/theme';

export default function HomeTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }} edges={['top']}>
      <HomeScreen />
    </SafeAreaView>
  );
}
