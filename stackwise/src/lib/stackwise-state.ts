'use client';

import { useMemo } from 'react';
import { DEFAULT_ALLOCATION, DEFAULT_MONTHLY_BUDGET } from './assets';
import { useLocalState } from './storage';
import type { Strategy } from './vca';

export interface Snapshot {
  date: string;        // ISO date
  invested: number;
  value: number;
}

export interface Transaction {
  date: string;        // ISO date
  amount: number;
  note?: string;
}

export interface StackwiseState {
  strategy: Strategy;
  monthlyBudget: number;
  allocation: Record<string, number>;
  holdings: Record<string, number>;       // symbol -> quantity
  manualPrices: Record<string, number>;   // symbol -> EUR price fallback
  totalInvested: number;
  transactions: Transaction[];
  snapshots: Snapshot[];
}

const DEFAULT_HOLDINGS: Record<string, number> = { BTC: 0, INJ: 0, XRP: 0, SOL: 0 };

export function useStackwise() {
  const [strategy, setStrategy, hyd1]               = useLocalState<Strategy>('strategy', 'VCA');
  const [monthlyBudget, setMonthlyBudget, hyd2]     = useLocalState<number>('monthly', DEFAULT_MONTHLY_BUDGET);
  const [allocation, setAllocation, hyd3]           = useLocalState<Record<string, number>>('alloc', DEFAULT_ALLOCATION);
  const [holdings, setHoldings, hyd4]               = useLocalState<Record<string, number>>('holdings', DEFAULT_HOLDINGS);
  const [manualPrices, setManualPrices, hyd5]       = useLocalState<Record<string, number>>('manual', {});
  const [totalInvested, setTotalInvested, hyd6]     = useLocalState<number>('invested', 0);
  const [transactions, setTransactions, hyd7]       = useLocalState<Transaction[]>('txs', []);
  const [snapshots, setSnapshots, hyd8]             = useLocalState<Snapshot[]>('snaps', []);

  const hydrated = hyd1 && hyd2 && hyd3 && hyd4 && hyd5 && hyd6 && hyd7 && hyd8;

  const state: StackwiseState = useMemo(
    () => ({ strategy, monthlyBudget, allocation, holdings, manualPrices, totalInvested, transactions, snapshots }),
    [strategy, monthlyBudget, allocation, holdings, manualPrices, totalInvested, transactions, snapshots],
  );

  return {
    ...state,
    hydrated,
    setStrategy,
    setMonthlyBudget,
    setAllocation,
    setHoldings,
    setManualPrices,
    setTotalInvested,
    setTransactions,
    setSnapshots,
  };
}
