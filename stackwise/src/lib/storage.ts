'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'sw_';

export function useLocalState<T>(key: string, defaultValue: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const fullKey = PREFIX + key;
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore — fall back to default
    }
    setHydrated(true);
  }, [fullKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      // quota or private mode — ignore silently
    }
  }, [fullKey, value, hydrated]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, update, hydrated];
}

export function clearStackwiseStorage(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(PREFIX)) toRemove.push(key);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
