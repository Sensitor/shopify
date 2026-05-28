import { describe, it, expect } from 'vitest';
import { accrueHoldings, portfolioValue } from './portfolio';

const PRICES: Record<string, number> = { BTC: 50000, SOL: 100, XRP: 0.5 };
const priceOf = (s: string) => PRICES[s] ?? 0;

describe('portfolioValue', () => {
  it('sums quantity × price over the given symbols', () => {
    const holdings = { BTC: 0.01, SOL: 5, XRP: 1000 };
    // 0.01*50000 + 5*100 + 1000*0.5 = 500 + 500 + 500
    expect(portfolioValue(holdings, ['BTC', 'SOL', 'XRP'], priceOf)).toBeCloseTo(1500, 6);
  });

  it('ignores symbols not in the list and missing holdings', () => {
    expect(portfolioValue({ BTC: 1 }, ['SOL'], priceOf)).toBe(0);
  });
});

describe('accrueHoldings', () => {
  it('adds bought quantity (eur / price) to existing holdings', () => {
    const holdings = { BTC: 0.01 };
    const next = accrueHoldings(holdings, { BTC: 500 }, priceOf); // +0.01 BTC
    expect(next.BTC).toBeCloseTo(0.02, 8);
  });

  it('creates a position for an asset not yet held', () => {
    const next = accrueHoldings({}, { SOL: 250 }, priceOf); // 250/100 = 2.5
    expect(next.SOL).toBeCloseTo(2.5, 8);
  });

  it('does not mutate the original holdings object', () => {
    const holdings = { BTC: 0.01 };
    accrueHoldings(holdings, { BTC: 500 }, priceOf);
    expect(holdings.BTC).toBe(0.01);
  });

  it('skips assets with no valid price (cannot compute quantity)', () => {
    const next = accrueHoldings({}, { INJ: 100 }, priceOf); // price 0 → skipped
    expect(next.INJ).toBeUndefined();
  });

  it('skips zero/negative euro amounts', () => {
    const next = accrueHoldings({ BTC: 0.01 }, { BTC: 0 }, priceOf);
    expect(next.BTC).toBeCloseTo(0.01, 8);
  });

  it('accrual then value reflects the invested amount at current price', () => {
    const next = accrueHoldings({}, { BTC: 500, SOL: 500, XRP: 500 }, priceOf);
    expect(portfolioValue(next, ['BTC', 'SOL', 'XRP'], priceOf)).toBeCloseTo(1500, 6);
  });
});
