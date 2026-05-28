import { describe, it, expect } from 'vitest';
import {
  computeRecommendation,
  weeklyBaseFromMonthly,
  VCA_MIN_RATIO,
  VCA_MAX_RATIO,
} from './vca';

const ALLOC = { BTC: 40, INJ: 25, XRP: 20, SOL: 15 };

describe('weeklyBaseFromMonthly', () => {
  it('converts monthly budget to weekly base (monthly * 12 / 52)', () => {
    expect(weeklyBaseFromMonthly(500)).toBeCloseTo((500 * 12) / 52, 8);
    expect(weeklyBaseFromMonthly(0)).toBe(0);
  });
});

describe('computeRecommendation — DCA', () => {
  it('returns the weekly base, isBehind null, and splits per allocation', () => {
    const out = computeRecommendation({
      strategy: 'DCA',
      monthlyBudget: 520, // weeklyBase = 120
      totalInvested: 9999, // ignored for DCA
      currentValue: 1, // ignored for DCA
      allocation: ALLOC,
    });
    expect(out.weeklyBase).toBeCloseTo(120, 8);
    expect(out.recommendedTotal).toBeCloseTo(120, 8);
    expect(out.isBehind).toBeNull();
    expect(out.perAsset.BTC).toBeCloseTo(48, 8);
    expect(out.perAsset.INJ).toBeCloseTo(30, 8);
    expect(out.perAsset.XRP).toBeCloseTo(24, 8);
    expect(out.perAsset.SOL).toBeCloseTo(18, 8);
    const sum = Object.values(out.perAsset).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(120, 8);
  });
});

describe('computeRecommendation — VCA behind (currentValue < totalInvested + weeklyBase)', () => {
  it('invests more than the base to catch up', () => {
    const monthlyBudget = 520; // weeklyBase = 120
    const totalInvested = 1000;
    const currentValue = 900; // en retard
    const out = computeRecommendation({
      strategy: 'VCA',
      monthlyBudget,
      totalInvested,
      currentValue,
      allocation: ALLOC,
    });
    expect(out.isBehind).toBe(true);
    expect(out.recommendedTotal).toBeCloseTo(1000 + 120 - 900, 8); // 220
    expect(out.recommendedTotal).toBeGreaterThan(out.weeklyBase);
    expect(out.recommendedTotal).toBeLessThanOrEqual(out.weeklyBase * VCA_MAX_RATIO);
  });
});

describe('computeRecommendation — VCA ahead (currentValue > totalInvested + weeklyBase)', () => {
  it('invests less than the base when the portfolio is ahead', () => {
    const monthlyBudget = 520;
    const totalInvested = 1000;
    const currentValue = 1100; // en avance
    const out = computeRecommendation({
      strategy: 'VCA',
      monthlyBudget,
      totalInvested,
      currentValue,
      allocation: ALLOC,
    });
    expect(out.isBehind).toBe(false);
    // raw needed = 1000 + 120 - 1100 = 20, mais bornes => min 25% * 120 = 30
    expect(out.recommendedTotal).toBeCloseTo(out.weeklyBase * VCA_MIN_RATIO, 8);
  });

  it('between the bounds returns the raw computation', () => {
    const monthlyBudget = 520; // weeklyBase 120
    // raw = 1000 + 120 - 1050 = 70 — entre 30 (min) et 300 (max)
    const out = computeRecommendation({
      strategy: 'VCA',
      monthlyBudget,
      totalInvested: 1000,
      currentValue: 1050,
      allocation: ALLOC,
    });
    expect(out.recommendedTotal).toBeCloseTo(70, 8);
    expect(out.isBehind).toBe(false);
  });
});

describe('computeRecommendation — VCA bounds', () => {
  it('clamps to MAX (250%) when very behind (e.g. crash)', () => {
    const out = computeRecommendation({
      strategy: 'VCA',
      monthlyBudget: 520, // weeklyBase 120, max = 300
      totalInvested: 5000,
      currentValue: 1000, // énorme retard, raw = 5000+120-1000 = 4120
      allocation: ALLOC,
    });
    expect(out.recommendedTotal).toBeCloseTo(out.weeklyBase * VCA_MAX_RATIO, 8);
    expect(out.isBehind).toBe(true);
  });

  it('clamps to MIN (25%) when very ahead (e.g. pump)', () => {
    const out = computeRecommendation({
      strategy: 'VCA',
      monthlyBudget: 520, // min = 30
      totalInvested: 1000,
      currentValue: 5000, // énorme avance, raw négatif
      allocation: ALLOC,
    });
    expect(out.recommendedTotal).toBeCloseTo(out.weeklyBase * VCA_MIN_RATIO, 8);
    expect(out.isBehind).toBe(false);
  });
});

describe('computeRecommendation — perAsset always sums to recommendedTotal', () => {
  it.each([
    { strategy: 'DCA' as const, currentValue: 0, totalInvested: 0 },
    { strategy: 'VCA' as const, currentValue: 800, totalInvested: 1000 },
    { strategy: 'VCA' as const, currentValue: 1500, totalInvested: 1000 },
  ])('sums perAsset == recommendedTotal for %j', (params) => {
    const out = computeRecommendation({
      monthlyBudget: 500,
      allocation: ALLOC,
      ...params,
    });
    const sum = Object.values(out.perAsset).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(out.recommendedTotal, 6);
  });

  it('handles non-100 allocation sums by normalising', () => {
    const out = computeRecommendation({
      strategy: 'DCA',
      monthlyBudget: 520,
      totalInvested: 0,
      currentValue: 0,
      allocation: { BTC: 1, ETH: 1 }, // sum=2
    });
    expect(out.perAsset.BTC).toBeCloseTo(60, 8);
    expect(out.perAsset.ETH).toBeCloseTo(60, 8);
  });

  it('returns zero per-asset when allocation sum is zero', () => {
    const out = computeRecommendation({
      strategy: 'DCA',
      monthlyBudget: 520,
      totalInvested: 0,
      currentValue: 0,
      allocation: { BTC: 0, ETH: 0 },
    });
    expect(out.perAsset.BTC).toBe(0);
    expect(out.perAsset.ETH).toBe(0);
  });
});
