import { useEffect, useMemo, useRef, useState } from 'react';

/*
 * This hook intentionally derives UI state from the open/closed transition.
 * Keeping the snapshot in refs prevents the form value itself from becoming a dependency
 * that resets the baseline on every keystroke.
 */
/* eslint-disable react-hooks/set-state-in-effect */

export default function useFormDirty(value: unknown, active: boolean) {
  const serializedValue = useMemo(() => JSON.stringify(value), [value]);
  const snapshotRef = useRef('');
  const wasActiveRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!active) {
      snapshotRef.current = '';
      wasActiveRef.current = false;
      setDirty(false);
      return;
    }

    if (!wasActiveRef.current) {
      snapshotRef.current = serializedValue;
      wasActiveRef.current = true;
      setDirty(false);
      return;
    }

    setDirty(serializedValue !== snapshotRef.current);
  }, [active, serializedValue]);

  return dirty;
}
