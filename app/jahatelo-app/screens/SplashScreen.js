import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedSplash from '../components/AnimatedSplash';

export default function SplashScreen({ navigation }) {
  const didNavigate = useRef(false);

  const goNext = () => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    navigation.replace('AgeGate');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      goNext();
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AnimatedSplash onFinish={goNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
