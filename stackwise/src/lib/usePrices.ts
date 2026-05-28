'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ASSETS } from './assets';

export type PriceStatus = 'idle' | 'loading' | 'live' | 'error';

export interface UsePricesResult {
  prices: Record<string, number>; // keyed by symbol (BTC, INJ...)
  status: PriceStatus;
  lastFetch: Date | null;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 60_000;

export function usePrices(symbols: string[]): UsePricesResult {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<PriceStatus>('idle');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const symKey = useMemo(() => [...symbols].sort().join(','), [symbols]);
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const refresh = useCallback(async () => {
    const syms = symbolsRef.current;
    const idEntries: Array<[string, string]> = syms
      .map((s) => [s, ASSETS[s as keyof typeof ASSETS]?.id ?? null] as const)
      .filter((e): e is [string, string] => !!e[1]);
    if (idEntries.length === 0) return;

    setStatus('loading');
    try {
      const idsParam = idEntries.map(([, id]) => id).join(',');
      const res = await fetch(`/api/prices?ids=${idsParam}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`api ${res.status}`);
      const { prices: byId } = (await res.json()) as { prices: Record<string, number> };

      const bySymbol: Record<string, number> = {};
      for (const [sym, id] of idEntries) {
        const p = byId[id];
        if (typeof p === 'number') bySymbol[sym] = p;
      }
      setPrices(bySymbol);
      setStatus('live');
      setLastFetch(new Date());
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (symKey === '') return;
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [symKey, refresh]);

  return { prices, status, lastFetch, refresh };
}
