'use client';

import { useState } from 'react';
import { ASSETS } from '@/lib/assets';
import { fmtEUR, fmtNum } from '@/lib/format';
import { splitByAllocation } from '@/lib/vca';
import { Btn } from './ui';

interface InvestModalProps {
  defaultTotal: number;
  allocation: Record<string, number>;
  effectivePrice: (sym: string) => number;
  onClose: () => void;
  onConfirm: (total: number, perAsset: Record<string, number>) => void;
}

export function InvestModal({
  defaultTotal,
  allocation,
  effectivePrice,
  onClose,
  onConfirm,
}: InvestModalProps) {
  const [total, setTotal] = useState<number>(Math.round(defaultTotal * 100) / 100);
  const perAsset = splitByAllocation(total, allocation);
  const symbols = Object.keys(allocation);
  const missingPrice = symbols.some((s) => effectivePrice(s) <= 0);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-lg font-extrabold">Enregistrer un investissement</div>
        <p className="mb-4 text-xs text-muted">
          On ajoute automatiquement les quantités achetées à tes avoirs (montant ÷ prix actuel).
        </p>

        <label className="mb-1 block text-[11px] text-muted">Montant total investi (€)</label>
        <input
          type="number"
          step="any"
          value={total}
          onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
          className="w-full rounded-xl border border-border bg-panel2 px-3 py-3 text-2xl font-extrabold text-text outline-none focus:border-accent"
          autoFocus
        />

        <div className="mt-4 flex flex-col gap-2">
          {symbols.map((sym) => {
            const meta = ASSETS[sym as keyof typeof ASSETS];
            const eur = perAsset[sym] ?? 0;
            const price = effectivePrice(sym);
            const qty = price > 0 ? eur / price : null;
            return (
              <div
                key={sym}
                className="flex items-center gap-3 rounded-xl bg-panel2 px-3 py-2.5"
                style={{ borderLeft: `3px solid ${meta?.color ?? '#7C6BFF'}` }}
              >
                <div className="w-10 text-xs font-extrabold" style={{ color: meta?.color ?? '#7C6BFF' }}>
                  {sym}
                </div>
                <div className="flex-1 text-sm">{fmtEUR(eur, 2)}</div>
                <div className="text-right text-sm font-bold">
                  {qty != null ? (
                    <>
                      +{fmtNum(qty, qty < 1 ? 6 : 4)} {sym}
                    </>
                  ) : (
                    <span className="text-warning">prix manquant</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {missingPrice && (
          <p className="mt-3 text-xs text-warning">
            Certains prix sont indisponibles : ces quantités ne seront pas ajoutées. Renseigne un prix
            manuel dans « Mes avoirs ».
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Btn kind="ghost" onClick={onClose}>
            Annuler
          </Btn>
          <Btn
            kind="accent"
            onClick={() => {
              onConfirm(total, perAsset);
              onClose();
            }}
            disabled={total <= 0}
          >
            Confirmer {fmtEUR(total, 2)}
          </Btn>
        </div>
      </div>
    </div>
  );
}
