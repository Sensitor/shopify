'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePrices } from '@/lib/usePrices';
import { useStackwise } from '@/lib/stackwise-state';
import { computeRecommendation, weeklyBaseFromMonthly } from '@/lib/vca';
import { accrueHoldings, portfolioValue } from '@/lib/portfolio';
import { todayISO } from '@/lib/format';
import { clearStackwiseStorage } from '@/lib/storage';
import { Dashboard } from './Dashboard';
import { Holdings } from './Holdings';
import { Plan } from './Plan';
import { PriceStatusBadge } from './PriceStatusBadge';
import { InvestModal } from './InvestModal';
import { Onboarding } from './Onboarding';

type Tab = 'dashboard' | 'holdings' | 'plan';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'holdings', label: 'Mes avoirs' },
  { id: 'plan', label: 'Plan & Réglages' },
];

export function App() {
  const sw = useStackwise();
  const symbols = useMemo(() => Object.keys(sw.allocation), [sw.allocation]);
  const { prices, status, lastFetch, refresh } = usePrices(symbols);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showInvest, setShowInvest] = useState(false);

  const effectivePrice = useCallback(
    (sym: string): number => prices[sym] ?? sw.manualPrices[sym] ?? 0,
    [prices, sw.manualPrices],
  );

  const portfolio = useMemo(() => {
    const lines = Object.keys(sw.allocation).map((sym) => {
      const qty = sw.holdings[sym] ?? 0;
      const price = effectivePrice(sym);
      const value = qty * price;
      return { sym, qty, price, value, target: sw.allocation[sym] ?? 0, weight: 0 };
    });
    const totalValue = lines.reduce((s, l) => s + l.value, 0);
    lines.forEach((l) => {
      l.weight = totalValue > 0 ? (l.value / totalValue) * 100 : 0;
    });
    return { lines, totalValue };
  }, [sw.allocation, sw.holdings, effectivePrice]);

  const reco = useMemo(
    () =>
      computeRecommendation({
        strategy: sw.strategy,
        monthlyBudget: sw.monthlyBudget,
        totalInvested: sw.totalInvested,
        currentValue: portfolio.totalValue,
        allocation: sw.allocation,
      }),
    [sw.strategy, sw.monthlyBudget, sw.totalInvested, sw.allocation, portfolio.totalValue],
  );

  // Calcule la valeur du portefeuille à partir d'un set de quantités donné.
  const valueOf = useCallback(
    (holdings: Record<string, number>) =>
      portfolioValue(holdings, Object.keys(sw.allocation), effectivePrice),
    [sw.allocation, effectivePrice],
  );

  // Investir = ajouter automatiquement les quantités achetées (montant ÷ prix) aux avoirs.
  const recordInvestment = useCallback(
    (total: number, perAsset: Record<string, number>) => {
      const today = todayISO();
      const nextHoldings = accrueHoldings(sw.holdings, perAsset, effectivePrice);
      const nextInvested = sw.totalInvested + total;
      const nextValue = valueOf(nextHoldings);

      sw.setHoldings(nextHoldings);
      sw.setTotalInvested(nextInvested);
      sw.setTransactions((prev) => [
        ...prev,
        { date: today, amount: total, note: sw.strategy === 'DCA' ? 'DCA' : 'VCA' },
      ]);
      sw.setSnapshots((prev) => {
        const without = prev.filter((s) => s.date !== today);
        return [
          ...without,
          { date: today, invested: nextInvested, value: Math.round(nextValue * 100) / 100 },
        ];
      });
    },
    [sw, effectivePrice, valueOf],
  );

  const completeOnboarding = useCallback(
    (holdings: Record<string, number>, totalInvested: number) => {
      const today = todayISO();
      sw.setHoldings(holdings);
      sw.setTotalInvested(totalInvested);
      sw.setSnapshots([
        { date: today, invested: totalInvested, value: Math.round(valueOf(holdings) * 100) / 100 },
      ]);
      sw.setOnboarded(true);
    },
    [sw, valueOf],
  );

  const recordSnapshot = useCallback(() => {
    sw.setSnapshots((prev) => {
      const today = todayISO();
      const without = prev.filter((s) => s.date !== today);
      return [
        ...without,
        {
          date: today,
          invested: sw.totalInvested,
          value: Math.round(portfolio.totalValue * 100) / 100,
        },
      ];
    });
  }, [sw, portfolio.totalValue]);

  const resetAll = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('Réinitialiser toutes les données ?')) return;
    clearStackwiseStorage();
    if (typeof window !== 'undefined') window.location.reload();
  }, []);

  const needsOnboarding =
    !sw.onboarded &&
    sw.totalInvested === 0 &&
    sw.snapshots.length === 0 &&
    Object.values(sw.holdings).every((q) => !q);

  if (!sw.hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">Chargement…</div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[-200px] h-[400px] w-[700px] -translate-x-1/2 blur-[40px]"
        style={{ background: 'radial-gradient(circle, #7C6BFF22, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-5">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-lg font-extrabold text-black"
              style={{
                background: 'linear-gradient(135deg, #7C6BFF, #22D67B)',
                boxShadow: '0 4px 20px #7C6BFF66',
              }}
            >
              S
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">Stackwise</div>
              <div className="text-[11px] text-muted">DCA · VCA tracker</div>
            </div>
          </div>
          <PriceStatusBadge status={status} lastFetch={lastFetch} onRefresh={() => void refresh()} />
        </header>

        <nav className="mb-6 inline-flex gap-1.5 rounded-2xl border border-border bg-panel p-1.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                tab === id ? 'bg-accent text-white' : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {needsOnboarding ? (
          <Onboarding
            symbols={symbols}
            effectivePrice={effectivePrice}
            onComplete={completeOnboarding}
            onSkip={() => sw.setOnboarded(true)}
          />
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard
                strategy={sw.strategy}
                reco={reco}
                portfolio={portfolio}
                totalInvested={sw.totalInvested}
                allocation={sw.allocation}
                snapshots={sw.snapshots}
                onOpenInvest={() => setShowInvest(true)}
                onSnapshot={recordSnapshot}
              />
            )}
          </>
        )}
        {!needsOnboarding && tab === 'holdings' && (
          <Holdings
            allocation={sw.allocation}
            holdings={sw.holdings}
            prices={prices}
            manualPrices={sw.manualPrices}
            priceStatus={status}
            totalValue={portfolio.totalValue}
            onUpdateHolding={(sym, qty) => sw.setHoldings((prev) => ({ ...prev, [sym]: qty }))}
            onUpdateManualPrice={(sym, p) => sw.setManualPrices((prev) => ({ ...prev, [sym]: p }))}
          />
        )}
        {!needsOnboarding && tab === 'plan' && (
          <Plan
            strategy={sw.strategy}
            monthlyBudget={sw.monthlyBudget}
            weekly={weeklyBaseFromMonthly(sw.monthlyBudget)}
            allocation={sw.allocation}
            onSetStrategy={sw.setStrategy}
            onSetMonthlyBudget={sw.setMonthlyBudget}
            onUpdateAllocation={(sym, pct) => sw.setAllocation((prev) => ({ ...prev, [sym]: pct }))}
            onReset={resetAll}
          />
        )}
      </div>

      {showInvest && (
        <InvestModal
          defaultTotal={reco.recommendedTotal}
          allocation={sw.allocation}
          effectivePrice={effectivePrice}
          onClose={() => setShowInvest(false)}
          onConfirm={recordInvestment}
        />
      )}
    </div>
  );
}
