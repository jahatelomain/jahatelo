import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function PremiumMarkerPin({
  plan = 'BASIC',
  isDisabled = false,
  size = 36
}) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const isPremium = plan === 'PREMIUM';
  const isPlatinum = plan === 'PLATINUM';
  const isSpecialPlan = isPremium || isPlatinum;

  // Tamaño según plan
  const pinSize = isSpecialPlan ? size * 1.25 : size; // 25% más grande
  const iconSize = isSpecialPlan ? 18 : 14;

  // Colores según plan
  let pinColor = COLORS.primary; // BASIC
  if (isPremium) pinColor = '#8B5CF6'; // Violeta brillante
  if (isPlatinum) pinColor = '#F59E0B'; // Dorado

  useEffect(() => {
    if (!isSpecialPlan || isDisabled) return;

    // Animación de rebote continuo para planes premium
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(1200), // Pausa entre rebotes
      ])
    );

    bounce.start();

    return () => bounce.stop();
  }, [isSpecialPlan, isDisabled]);

  return (
    <Animated.View
      style={[
        styles.container,
        isSpecialPlan && {
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      {/* Pin principal */}
      <View
        style={[
          styles.pin,
          {
            width: pinSize,
            height: pinSize,
            backgroundColor: isDisabled ? '#CCCCCC' : pinColor,
            borderRadius: pinSize / 2,
          },
          isDisabled && styles.disabledPin,
        ]}
      >
        <View style={styles.pinInner}>
          <Ionicons
            name="heart"
            size={iconSize}
            color={COLORS.white}
          />
        </View>

        {/* Badge especial para PLATINUM */}
        {isPlatinum && !isDisabled && (
          <View style={styles.platinumBadge}>
            <Ionicons name="star" size={12} color="#FCD34D" />
          </View>
        )}
      </View>

      {/* Punta del pin */}
      <View
        style={[
          styles.pinTip,
          {
            borderLeftWidth: pinSize * 0.3,
            borderRightWidth: pinSize * 0.3,
            borderTopWidth: pinSize * 0.4,
            borderTopColor: isDisabled ? '#CCCCCC' : pinColor,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -3,
  },
  disabledPin: {
    opacity: 0.6,
  },
  platinumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
