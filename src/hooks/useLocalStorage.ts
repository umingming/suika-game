'use client';

import { useState, useCallback } from 'react';

export function useLocalStorage(key: string, initialValue: number): [number, (value: number) => void] {
  const [storedValue, setStoredValue] = useState<number>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? parseInt(item, 10) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: number) => {
    setStoredValue(value);
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // localStorage not available
    }
  }, [key]);

  return [storedValue, setValue];
}
