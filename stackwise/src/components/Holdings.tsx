'use client';

import { ASSETS } from '@/lib/assets';
import { fmtEUR } from '@/lib/format';
import { Card, Field, SectionTitle, inputClass } from './ui';

interface HoldingsProps {
  allocation: Record<string, number>;
  holdings: Record<string, number>;
  prices: Record<string, number>;
  manualPrices: Record<string, number>;
  priceStatus: 'idle' | 'loading' | 'live' | 'error';
  totalValue: number;
  onUpdateHolding: (sym: string, qty: number) => void;
  onUpdateManualPrice: (sym: string, price: number) => void;
}

export function Holdings({
  allocation,
  holdings,
  prices,
  manualPrices,
  priceStatus,
  totalValue,
  onUpdateHolding,
  onUpdateManualPrice,
}: HoldingsProps) {
  return (
    <div className="flex flex-col gap-4">
      {priceStatus === 'error' && (
        <Card className="border-warning bg-warning/10 p-3 text-sm text-warning">
          Prix live indisponibles. Saisis les prix manuellement ci-dessous — ils seront utilisés pour les calculs.
        </Card>
      )}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <SectionTitle>Mes avoirs</SectionTitle>
          <p className="mt-1 text-xs text-muted">
            Entre la quantité que tu détiens de chaque crypto. La valeur se calcule avec le prix live (ou ton prix manuel).
          </p>
        </div>
        {Object.keys(allocation).map((sym) => {
          const meta = ASSETS[sym as keyof typeof ASSETS];
          const live = prices[sym];
          const manual = manualPrices[sym];
          const price = live ?? manual ?? 0;
          const qty = holdings[sym] ?? 0;
          return (
            <div
              key={sym}
              className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-xl text-xs font-extrabold"
                style={{
                  background: `${meta?.color ?? '#7C6BFF'}22`,
                  color: meta?.color ?? '#7C6BFF',
                }}
              >
                {sym}
              </div>
              <div className="min-w-[110px] flex-1">
                <div className="font-bold">{meta?.name ?? sym}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  {live != null ? (
                    <>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                      {fmtEUR(live, live < 1 ? 4 : 2)} live
                    </>
                  ) : (
                    <>prix manuel</>
                  )}
                </div>
              </div>
              <Field label="Quantité" width={110}>
                <input
                  type="number"
                  step="any"
                  defaultValue={qty}
                  onBlur={(e) => onUpdateHolding(sym, parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </Field>
              {live == null && (
                <Field label="Prix (€)" width={100}>
                  <input
                    type="number"
                    step="any"
                    defaultValue={manual ?? ''}
                    onBlur={(e) => onUpdateManualPrice(sym, parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </Field>
              )}
              <div className="min-w-[90px] text-right">
                <div className="text-[11px] text-muted">Valeur</div>
                <div className="text-base font-extrabold">{fmtEUR(qty * price, 2)}</div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-between bg-panel2 px-4 py-3">
          <span className="font-bold text-muted">Total</span>
          <span className="text-lg font-extrabold">{fmtEUR(totalValue, 2)}</span>
        </div>
      </Card>
    </div>
  );
}
