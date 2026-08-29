'use client';

import { useEffect, useState } from 'react';

export function usePersistentAdminFilters<T>(key: string, initialValue: T) {
  const storageKey = `jahatelo:admin:filters:${key}`;
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) as T : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value]);

  return [value, setValue] as const;
}
