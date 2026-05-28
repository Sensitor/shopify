'use client';

import { useRef } from 'react';
import { ASSETS } from '@/lib/assets';
import { fmtEUR, todayISO } from '@/lib/format';
import { exportData, importData } from '@/lib/storage';
import type { Strategy } from '@/lib/vca';
import { Btn, Card, Field, SectionTitle, inputClass } from './ui';

interface PlanProps {
  strategy: Strategy;
  monthlyBudget: number;
  weekly: number;
  allocation: Record<string, number>;
  onSetStrategy: (s: Strategy) => void;
  onSetMonthlyBudget: (n: number) => void;
  onUpdateAllocation: (sym: string, pct: number) => void;
  onReset: () => void;
}

export function Plan({
  strategy,
  monthlyBudget,
  weekly,
  allocation,
  onSetStrategy,
  onSetMonthlyBudget,
  onUpdateAllocation,
  onReset,
}: PlanProps) {
  const allocSum = Object.values(allocation).reduce((a, b) => a + b, 0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stackwise-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      if (ok) {
        window.location.reload();
      } else {
        window.alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <SectionTitle>Stratégie</SectionTitle>
        <div className="mt-3 flex gap-3">
          {(['DCA', 'VCA'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onSetStrategy(m)}
              className={`flex-1 rounded-2xl border px-4 py-4 text-left transition-colors ${
                strategy === m
                  ? 'border-accent bg-accent/15'
                  : 'border-border bg-panel2 hover:border-accent/40'
              }`}
            >
              <div className={`text-base font-extrabold ${strategy === m ? 'text-accent' : 'text-text'}`}>{m}</div>
              <div className="mt-1 text-xs text-muted">
                {m === 'DCA' ? 'Montant fixe chaque semaine' : 'Montant ajusté selon ta trajectoire'}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Budget</SectionTitle>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Field label="Par mois (€)" width={140}>
            <input
              type="number"
              defaultValue={monthlyBudget}
              onBlur={(e) => onSetMonthlyBudget(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>
          <div className="pb-3 text-sm text-muted">
            soit <b className="text-text">{fmtEUR(weekly, 2)}</b> / semaine
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Allocation cible</SectionTitle>
        <div className="mt-3 flex flex-col gap-2.5">
          {Object.keys(allocation).map((sym) => {
            const color = ASSETS[sym as keyof typeof ASSETS]?.color ?? '#7C6BFF';
            return (
              <div key={sym} className="flex items-center gap-3">
                <div className="w-10 font-extrabold" style={{ color }}>{sym}</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={allocation[sym] ?? 0}
                  onChange={(e) => onUpdateAllocation(sym, parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  style={{ accentColor: color }}
                />
                <div className="w-12 text-right font-bold">{allocation[sym] ?? 0}%</div>
              </div>
            );
          })}
        </div>
        <div className={`mt-3 text-sm font-bold ${allocSum === 100 ? 'text-success' : 'text-warning'}`}>
          Total : {allocSum}% {allocSum !== 100 && '— ajuste pour atteindre 100%'}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Sauvegarde</SectionTitle>
        <p className="mt-2 mb-3 text-sm text-muted">
          Tes données vivent dans ce navigateur. Exporte un fichier de sauvegarde pour ne rien perdre, ou
          le réimporter sur un autre appareil/navigateur.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn kind="ghost" onClick={handleExport}>
            ⬇ Exporter une sauvegarde
          </Btn>
          <Btn kind="ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Importer
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Réinitialiser</SectionTitle>
        <p className="mt-2 mb-3 text-sm text-muted">Efface toutes tes données de ce navigateur.</p>
        <Btn kind="danger" onClick={onReset}>
          Réinitialiser tout
        </Btn>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-faint">
        Stackwise — outil de suivi personnel. Ne constitue pas un conseil en investissement.
        <br />
        Les crypto-actifs présentent un risque de perte élevé.
      </p>
    </div>
  );
}
