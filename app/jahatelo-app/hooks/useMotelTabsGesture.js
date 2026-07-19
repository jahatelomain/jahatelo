import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

const MIN_HORIZONTAL_DISTANCE = 18;
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
  const childHorizontalGestureActive = useRef(false);

  tabsRef.current = tabs;
  activeTabRef.current = activeTab;
  onTabChangeRef.current = onTabChange;

  const panHandlers = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      if (childHorizontalGestureActive.current) return false;
      return shouldCaptureTabSwipe(gestureState);
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, vx } = gestureState;
      const nextTab = getTabAfterSwipe({
        tabs: tabsRef.current,
        activeTab: activeTabRef.current,
        dx,
        vx,
      });
      if (nextTab) onTabChangeRef.current(nextTab);
    },
    onPanResponderTerminationRequest: () => true,
  }).panHandlers, []);

  return {
    panHandlers,
    beginChildHorizontalGesture: () => {
      childHorizontalGestureActive.current = true;
    },
    endChildHorizontalGesture: () => {
      childHorizontalGestureActive.current = false;
    },
  };
}
