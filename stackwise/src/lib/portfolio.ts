/** Valeur d'un portefeuille = somme des quantités × prix effectif. */
export function portfolioValue(
  holdings: Record<string, number>,
  symbols: string[],
  priceOf: (sym: string) => number,
): number {
  return symbols.reduce((sum, sym) => sum + (holdings[sym] ?? 0) * priceOf(sym), 0);
}

/**
 * Accumulation : convertit un investissement (€ par actif) en quantités achetées
 * (montant ÷ prix) et les ajoute aux avoirs existants. Les actifs sans prix
 * valide (≤ 0) sont ignorés (on ne peut pas calculer la quantité).
 */
export function accrueHoldings(
  holdings: Record<string, number>,
  perAsset: Record<string, number>,
  priceOf: (sym: string) => number,
): Record<string, number> {
  const next = { ...holdings };
  for (const [sym, eur] of Object.entries(perAsset)) {
    const price = priceOf(sym);
    if (price > 0 && eur > 0) {
      next[sym] = (next[sym] ?? 0) + eur / price;
    }
  }
  return next;
}
