import React, { forwardRef, useRef } from 'react';
import { Easing, FlatList, Image, ScrollView, View } from 'react-native';

const withoutLayoutAnimationProps = (Component) => forwardRef(function StaticAnimatedComponent(
  { entering, exiting, layout, ...props },
  ref
) {
  return <Component ref={ref} {...props} />;
});

const Animated = {
  View: withoutLayoutAnimationProps(View),
  ScrollView: withoutLayoutAnimationProps(ScrollView),
  FlatList: withoutLayoutAnimationProps(FlatList),
  Image: withoutLayoutAnimationProps(Image),
  createAnimatedComponent: withoutLayoutAnimationProps,
};

const transitionBuilder = new Proxy({}, {
  get: () => () => transitionBuilder,
});

export const FadeIn = transitionBuilder;
export const FadeInDown = transitionBuilder;
export const FadeInRight = transitionBuilder;
export const SlideInLeft = transitionBuilder;
export const SlideInUp = transitionBuilder;
export const Extrapolate = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export { Easing };

export function useSharedValue(initialValue) {
  return useRef({ value: initialValue }).current;
}

export function useAnimatedStyle(factory) {
  return factory();
}

export function useAnimatedScrollHandler(handlers) {
  return (event) => handlers?.onScroll?.(event.nativeEvent);
}

export function withSpring(value, _config, callback) {
  callback?.(true);
  return value;
}

export function withTiming(value, _config, callback) {
  callback?.(true);
  return value;
}

export function withSequence(...values) {
  return values.at(-1);
}

export function withRepeat(value) {
  return value;
}

export function cancelAnimation() {}

export function interpolate(value, inputRange, outputRange, extrapolation = Extrapolate.EXTEND) {
  if (inputRange.length < 2 || outputRange.length < 2) return outputRange[0] ?? value;
  let index = inputRange.findIndex((point) => value <= point) - 1;
  index = Math.max(0, Math.min(index, inputRange.length - 2));
  const inputStart = inputRange[index];
  const inputEnd = inputRange[index + 1];
  const ratio = inputEnd === inputStart ? 0 : (value - inputStart) / (inputEnd - inputStart);
  let result = outputRange[index] + ratio * (outputRange[index + 1] - outputRange[index]);
  if (extrapolation === Extrapolate.CLAMP) {
    result = Math.max(Math.min(...outputRange), Math.min(Math.max(...outputRange), result));
  }
  return result;
}

export default Animated;
