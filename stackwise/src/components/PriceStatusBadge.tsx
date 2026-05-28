'use client';

import type { PriceStatus } from '@/lib/usePrices';

const MAP: Record<PriceStatus, { color: string; label: string }> = {
  idle:    { color: 'bg-muted',   label: 'En attente' },
  loading: { color: 'bg-warning', label: 'Chargement…' },
  live:    { color: 'bg-success', label: 'Prix live' },
  error:   { color: 'bg-warning', label: 'Erreur prix' },
};

export function PriceStatusBadge({
  status,
  lastFetch,
  onRefresh,
}: {
  status: PriceStatus;
  lastFetch: Date | null;
  onRefresh: () => void;
}) {
  const { color, label } = MAP[status];
  const pulsing = status === 'live';
  return (
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1.5 text-text hover:bg-panel2"
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${color} ${pulsing ? 'shadow-[0_0_8px_currentColor]' : ''}`}
      />
      <span className="text-xs font-semibold">{label}</span>
      {lastFetch && status === 'live' && (
        <span className="text-[10px] text-faint">
          {lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <span className="text-sm text-muted">↻</span>
    </button>
  );
}
