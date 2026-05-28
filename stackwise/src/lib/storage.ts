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

/** Sérialise toutes les clés Stackwise en JSON (pour sauvegarde manuelle). */
export function exportData(): string {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  } catch {
    // ignore
  }
  return JSON.stringify({ app: 'stackwise', exportedAt: new Date().toISOString(), data }, null, 2);
}

/** Restaure les données depuis un JSON produit par exportData(). Retourne true si OK. */
export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
    const data = parsed?.data;
    if (!data || typeof data !== 'object') return false;
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(PREFIX)) continue;
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
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
