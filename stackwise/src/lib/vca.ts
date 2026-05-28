export type Strategy = 'DCA' | 'VCA';

export interface VCAInput {
  strategy: Strategy;
  monthlyBudget: number;
  totalInvested: number;
  currentValue: number;
  allocation: Record<string, number>;
}

export interface VCAOutput {
  weeklyBase: number;
  recommendedTotal: number;
  isBehind: boolean | null;
  perAsset: Record<string, number>;
}

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const VCA_MIN_RATIO = 0.25;
export const VCA_MAX_RATIO = 2.5;

export function weeklyBaseFromMonthly(monthlyBudget: number): number {
  return (monthlyBudget * MONTHS_PER_YEAR) / WEEKS_PER_YEAR;
}

function splitByAllocation(
  total: number,
  allocation: Record<string, number>,
): Record<string, number> {
  const entries = Object.entries(allocation);
  const sum = entries.reduce((acc, [, w]) => acc + w, 0);
  if (sum <= 0) {
    return Object.fromEntries(entries.map(([s]) => [s, 0]));
  }
  return Object.fromEntries(entries.map(([s, w]) => [s, (total * w) / sum]));
}

export function computeRecommendation(input: VCAInput): VCAOutput {
  const weeklyBase = weeklyBaseFromMonthly(input.monthlyBudget);

  if (input.strategy === 'DCA') {
    return {
      weeklyBase,
      recommendedTotal: weeklyBase,
      isBehind: null,
      perAsset: splitByAllocation(weeklyBase, input.allocation),
    };
  }

  const targetNext = input.totalInvested + weeklyBase;
  const rawNeeded = targetNext - input.currentValue;
  const recommendedTotal = Math.max(
    weeklyBase * VCA_MIN_RATIO,
    Math.min(weeklyBase * VCA_MAX_RATIO, rawNeeded),
  );

  return {
    weeklyBase,
    recommendedTotal,
    isBehind: input.currentValue < input.totalInvested,
    perAsset: splitByAllocation(recommendedTotal, input.allocation),
  };
}
