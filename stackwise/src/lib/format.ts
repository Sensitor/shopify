const euro = (digits: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: digits,
  });

export function fmtEUR(n: number | null | undefined, digits = 0): string {
  return euro(digits).format(n ?? 0);
}

export function fmtNum(n: number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(n ?? 0);
}

export function fmtPct(ratio: number): string {
  const sign = ratio >= 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
