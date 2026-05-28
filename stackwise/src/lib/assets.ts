export type AssetSymbol = 'BTC' | 'ETH' | 'INJ' | 'XRP' | 'SOL' | 'ADA' | 'DOT' | 'LINK';

export interface AssetMeta {
  id: string;       // coingecko id
  name: string;
  color: string;
}

export const ASSETS: Record<AssetSymbol, AssetMeta> = {
  BTC:  { id: 'bitcoin',            name: 'Bitcoin',   color: '#F7931A' },
  ETH:  { id: 'ethereum',           name: 'Ethereum',  color: '#627EEA' },
  INJ:  { id: 'injective-protocol', name: 'Injective', color: '#00D2FF' },
  XRP:  { id: 'ripple',             name: 'XRP',       color: '#23B6E8' },
  SOL:  { id: 'solana',             name: 'Solana',    color: '#14F195' },
  ADA:  { id: 'cardano',            name: 'Cardano',   color: '#0D6EFD' },
  DOT:  { id: 'polkadot',           name: 'Polkadot',  color: '#E6007A' },
  LINK: { id: 'chainlink',          name: 'Chainlink', color: '#2A5ADA' },
};

export const DEFAULT_ALLOCATION: Record<string, number> = {
  BTC: 40, INJ: 25, XRP: 20, SOL: 15,
};

export const DEFAULT_MONTHLY_BUDGET = 500;

export function isKnownSymbol(sym: string): sym is AssetSymbol {
  return sym in ASSETS;
}
