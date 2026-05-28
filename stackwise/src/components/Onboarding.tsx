'use client';

import { useState } from 'react';
import { ASSETS } from '@/lib/assets';
import { fmtEUR } from '@/lib/format';
import { Btn, Card, Field, SectionTitle, inputClass } from './ui';

interface OnboardingProps {
  symbols: string[];
  effectivePrice: (sym: string) => number;
  onComplete: (holdings: Record<string, number>, totalInvested: number) => void;
  onSkip: () => void;
}

export function Onboarding({ symbols, effectivePrice, onComplete, onSkip }: OnboardingProps) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [invested, setInvested] = useState<number>(0);

  const currentValue = symbols.reduce((s, sym) => s + (qty[sym] ?? 0) * effectivePrice(sym), 0);

  return (
    <Card className="p-6">
      <div className="mb-1 text-2xl">👋</div>
      <SectionTitle>Configure ta position de départ</SectionTitle>
      <p className="mb-5 mt-1 max-w-lg text-sm leading-relaxed text-muted">
        Saisis <b>une seule fois</b> ce que tu possèdes déjà. Ensuite, à chaque fois que tu cliques sur
        « J&apos;ai investi », l&apos;app ajoutera automatiquement les quantités — tu n&apos;auras plus à les
        retaper.
      </p>

      <div className="flex flex-col gap-2.5">
        {symbols.map((sym) => {
          const meta = ASSETS[sym as keyof typeof ASSETS];
          const price = effectivePrice(sym);
          return (
            <div key={sym} className="flex items-center gap-3 rounded-xl bg-panel2 px-3 py-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-lg text-[11px] font-extrabold"
                style={{ background: `${meta?.color ?? '#7C6BFF'}22`, color: meta?.color ?? '#7C6BFF' }}
              >
                {sym}
              </div>
              <div className="flex-1 text-sm font-bold">{meta?.name ?? sym}</div>
              <Field label={`Quantité ${sym}`} width={150}>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  onChange={(e) =>
                    setQty((prev) => ({ ...prev, [sym]: parseFloat(e.target.value) || 0 }))
                  }
                  className={inputClass}
                />
              </Field>
              <div className="min-w-[80px] text-right text-xs text-muted">
                {price > 0 ? fmtEUR((qty[sym] ?? 0) * price, 2) : '—'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <Field label="Total déjà investi (€)" width={180}>
          <input
            type="number"
            step="any"
            placeholder="0"
            onChange={(e) => setInvested(parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>
        <div className="pb-2.5 text-sm text-muted">
          Valeur actuelle estimée : <b className="text-text">{fmtEUR(currentValue, 2)}</b>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Btn kind="accent" onClick={() => onComplete(qty, invested)}>
          Démarrer mon suivi
        </Btn>
        <Btn kind="ghost" onClick={onSkip}>
          Je pars de zéro
        </Btn>
      </div>
    </Card>
  );
}
