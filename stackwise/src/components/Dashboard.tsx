'use client';

import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ASSETS } from '@/lib/assets';
import { fmtEUR, fmtNum, fmtPct, todayISO } from '@/lib/format';
import type { VCAOutput } from '@/lib/vca';
import { Btn, Card, Pill, SectionTitle } from './ui';
import type { Snapshot } from '@/lib/stackwise-state';

interface PortfolioLine {
  sym: string;
  qty: number;
  price: number;
  value: number;
  target: number;
  weight: number;
}

interface DashboardProps {
  strategy: 'DCA' | 'VCA';
  reco: VCAOutput;
  portfolio: { lines: PortfolioLine[]; totalValue: number };
  totalInvested: number;
  allocation: Record<string, number>;
  snapshots: Snapshot[];
  onOpenInvest: () => void;
  onSnapshot: () => void;
}

export function Dashboard({
  strategy,
  reco,
  portfolio,
  totalInvested,
  allocation,
  snapshots,
  onOpenInvest,
  onSnapshot,
}: DashboardProps) {
  const gap = portfolio.totalValue - totalInvested;
  const gapPct = totalInvested > 0 ? gap / totalInvested : 0;
  const isEmpty = portfolio.totalValue === 0 && totalInvested === 0;

  if (isEmpty) {
    return (
      <Card className="p-12 text-center">
        <div className="mb-2 text-4xl">📈</div>
        <h2 className="mb-2 text-xl font-bold">Prêt à empiler</h2>
        <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-muted">
          Quand tu fais ton versement, clique sur « J&apos;ai investi » : l&apos;app convertit le montant en
          quantités et les ajoute automatiquement à tes avoirs.
        </p>
        <Btn kind="accent" onClick={onOpenInvest}>
          J’ai investi…
        </Btn>
      </Card>
    );
  }

  const pieData = portfolio.lines
    .filter((l) => l.value > 0)
    .map((l) => ({
      name: l.sym,
      value: l.value,
      color: ASSETS[l.sym as keyof typeof ASSETS]?.color ?? '#7C6BFF',
    }));

  const chartData = [...snapshots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      label: s.date.slice(5),
      value: s.value,
      invested: s.invested,
      gap: s.value - s.invested,
    }));

  const todayHasSnapshot = snapshots.some((s) => s.date === todayISO());

  const recoBorder =
    reco.isBehind === false ? 'border-success' : reco.isBehind ? 'border-warning' : 'border-border';
  const recoBanner =
    reco.isBehind
      ? 'bg-warning/15 text-warning'
      : reco.isBehind === false
        ? 'bg-success/15 text-success'
        : 'bg-panel2 text-muted';
  const recoAmountColor =
    strategy === 'DCA' ? 'text-accent' : reco.isBehind ? 'text-warning' : 'text-success';

  return (
    <div className="flex flex-col gap-4">
      {/* Hero value */}
      <Card className="overflow-hidden bg-gradient-to-br from-panel to-panel2 px-6 pb-5 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-widest text-muted">Valeur du portefeuille</div>
            <div className="text-5xl font-extrabold leading-none tracking-tight">{fmtEUR(portfolio.totalValue, 2)}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Pill label="Investi" value={fmtEUR(totalInvested)} />
              <div className={`flex items-center gap-1.5 text-[15px] font-bold ${gap >= 0 ? 'text-success' : 'text-danger'}`}>
                <span className="text-lg">{gap >= 0 ? '▲' : '▼'}</span>
                {fmtEUR(gap, 2)} <span className="opacity-80">({fmtPct(gapPct)})</span>
              </div>
            </div>
          </div>
          {pieData.length > 0 && (
            <div className="h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3} stroke="none">
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      {/* Reco VCA */}
      <Card className={`overflow-hidden p-0 ${recoBorder}`}>
        <div className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${recoBanner}`}>
          {strategy === 'VCA' ? 'Recommandation VCA' : 'Versement DCA'} · cette semaine
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[200px] flex-1">
              <div className="mb-1 text-2xl font-extrabold">
                {strategy === 'DCA'
                  ? 'Investis ton montant fixe'
                  : reco.isBehind
                    ? 'En retard → renforce'
                    : 'En avance → allège'}
              </div>
              <p className="m-0 max-w-md text-sm leading-relaxed text-muted">
                {strategy === 'DCA'
                  ? 'En DCA, tu investis le même montant chaque semaine, quelle que soit la valeur du marché.'
                  : reco.isBehind
                    ? 'Ta valeur est sous ta trajectoire d’investissement. Le VCA suggère d’investir un peu plus pour profiter des prix bas.'
                    : 'Ta valeur dépasse ta trajectoire. Le VCA suggère d’investir moins et de mettre le surplus en réserve.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted">À investir</div>
              <div className={`text-4xl font-extrabold leading-none ${recoAmountColor}`}>
                {fmtEUR(reco.recommendedTotal, 2)}
              </div>
              {strategy === 'VCA' && (
                <div className="text-[11px] text-faint">DCA de base : {fmtEUR(reco.weeklyBase, 2)}</div>
              )}
            </div>
          </div>

          {Object.keys(reco.perAsset).length > 0 && (
            <div
              className="mt-4 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Object.keys(reco.perAsset).length}, minmax(0, 1fr))` }}
            >
              {Object.entries(reco.perAsset).map(([sym, amt]) => (
                <div
                  key={sym}
                  className="rounded-xl bg-panel2 px-3 py-2.5"
                  style={{ borderTop: `2px solid ${ASSETS[sym as keyof typeof ASSETS]?.color ?? '#7C6BFF'}` }}
                >
                  <div
                    className="text-xs font-extrabold"
                    style={{ color: ASSETS[sym as keyof typeof ASSETS]?.color ?? '#7C6BFF' }}
                  >
                    {sym}
                  </div>
                  <div className="text-base font-bold">{fmtEUR(amt, 2)}</div>
                  <div className="text-[10px] text-faint">{allocation[sym] ?? 0}%</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn kind="accent" onClick={onOpenInvest}>
              J’ai investi…
            </Btn>
            <Btn kind="ghost" onClick={onSnapshot}>
              {todayHasSnapshot ? 'Mettre à jour le relevé' : 'Enregistrer un relevé'}
            </Btn>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Stackwise présente un calcul automatique basé sur ta stratégie. Ce n&apos;est pas un conseil en investissement.
          </p>
        </div>
      </Card>

      {/* Positions */}
      {portfolio.lines.some((l) => l.qty > 0 || l.value > 0) && (
        <Card className="p-5">
          <SectionTitle>Mes positions</SectionTitle>
          <div className="mt-3 flex flex-col gap-3.5">
            {portfolio.lines.map((l) => {
              const meta = ASSETS[l.sym as keyof typeof ASSETS];
              const color = meta?.color ?? '#7C6BFF';
              return (
                <div key={l.sym}>
                  <div className="mb-1 flex items-center gap-2.5">
                    <div
                      className="grid h-8 w-8 place-items-center rounded-lg text-[10px] font-extrabold"
                      style={{ background: `${color}22`, color }}
                    >
                      {l.sym}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{meta?.name ?? l.sym}</span>
                        <span className="text-sm font-extrabold">{fmtEUR(l.value, 2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>
                          {fmtNum(l.qty, l.qty > 0 && l.qty < 1 ? 6 : 4)} {l.sym}
                        </span>
                        <span>
                          {l.weight.toFixed(0)}% <span className="text-faint">/ cible {l.target}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Barre : allocation réelle vs cible */}
                  <div className="relative ml-[42px] h-1.5 overflow-hidden rounded-full bg-panel2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, l.weight)}%`, background: color }}
                    />
                    <div
                      className="absolute top-[-1px] h-[7px] w-0.5 bg-text/70"
                      style={{ left: `${Math.min(100, l.target)}%` }}
                      title={`Cible ${l.target}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <Card className="px-3 pb-2 pt-5">
          <div className="px-2">
            <SectionTitle>Valeur réelle vs investi</SectionTitle>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D67B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22D67B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222B45" vertical={false} />
              <XAxis dataKey="label" stroke="#5A6685" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#5A6685"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{ background: '#161D33', border: '1px solid #222B45', borderRadius: 10, color: '#EAEEF8' }}
                formatter={(v: number, n: string) => [fmtEUR(v, 2), n === 'value' ? 'Valeur' : 'Investi']}
              />
              <Area type="monotone" dataKey="value" stroke="#22D67B" strokeWidth={2.6} fill="url(#gv)" />
              <Line type="monotone" dataKey="invested" stroke="#8693B0" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card className="px-3 pb-2 pt-5">
          <div className="px-2">
            <SectionTitle>Gain / perte par relevé</SectionTitle>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222B45" vertical={false} />
              <XAxis dataKey="label" stroke="#5A6685" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#5A6685"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{ background: '#161D33', border: '1px solid #222B45', borderRadius: 10 }}
                formatter={(v: number) => [fmtEUR(v, 2), 'Gain/Perte']}
              />
              <ReferenceLine y={0} stroke="#5A6685" />
              <Bar dataKey="gap" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.gap >= 0 ? '#22D67B' : '#FF5470'} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
