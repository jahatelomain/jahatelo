import { useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

// Un gesto de pestaña debe ser deliberado. Un umbral alto permite que los
// carruseles internos (fotos) activen primero su propio scroll nativo.
const MIN_HORIZONTAL_DISTANCE = 64;
const SWIPE_DISTANCE = 55;
const SWIPE_VELOCITY = 0.35;

export function shouldCaptureTabSwipe({ dx, dy }) {
  return Math.abs(dx) > MIN_HORIZONTAL_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5;
}

export function getTabAfterSwipe({ tabs, activeTab, dx, vx }) {
  if (Math.abs(dx) <= SWIPE_DISTANCE && Math.abs(vx) <= SWIPE_VELOCITY) return null;

  const currentIndex = tabs.findIndex((tab) => tab.name === activeTab);
  if (currentIndex < 0) return null;

  const direction = dx < 0 ? 1 : -1;
  const nextIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
  return nextIndex === currentIndex ? null : tabs[nextIndex].name;
}

export default function useMotelTabsGesture({ tabs, activeTab, onTabChange }) {
  const tabsRef = useRef(tabs);
  const activeTabRef = useRef(activeTab);
  const onTabChangeRef = useRef(onTabChange);

  tabsRef.current = tabs;
  activeTabRef.current = activeTab;
  onTabChangeRef.current = onTabChange;

  const tabSwipeGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-MIN_HORIZONTAL_DISTANCE, MIN_HORIZONTAL_DISTANCE])
    .failOffsetY([-16, 16])
    .runOnJS(true)
    .onEnd(({ translationX, velocityX }) => {
      const nextTab = getTabAfterSwipe({
        tabs: tabsRef.current,
        activeTab: activeTabRef.current,
        dx: translationX,
        vx: velocityX,
      });
      if (nextTab) onTabChangeRef.current(nextTab);
    }), []);

  return {
    tabSwipeGesture,
  };
}
