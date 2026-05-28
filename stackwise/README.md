# Stackwise

Tracker crypto perso **DCA / VCA** — Next.js 14 + TypeScript + Tailwind.
Persistance dans le `localStorage` du navigateur, prix live via proxy CoinGecko côté serveur.

## Fonctionnalités

- **Dashboard** : valeur totale live, plus/moins-value, donut d'allocation, courbe valeur vs investi, gain/perte par relevé.
- **Recommandation VCA/DCA** : montant à investir cette semaine, ventilé par actif, avec messages contextuels.
- **Mes avoirs** : saisie des quantités détenues, prix live affiché (avec fallback prix manuel).
- **Plan & Réglages** : stratégie (DCA/VCA), budget mensuel, allocation cible avec sliders.
- **Prix live** : refresh auto toutes les 60 s via `/api/prices` (clé CoinGecko jamais exposée au client).

## Installation locale

```bash
cd stackwise
npm install
cp .env.example .env.local       # remplis COINGECKO_API_KEY
npm run dev                      # http://localhost:3000
```

## Tests

```bash
npm test          # Vitest, 12 tests sur le moteur VCA
npm run build     # vérifie le type-check + le build Next.js
```

## Variables d'environnement

```env
COINGECKO_API_KEY=CG-xxxxxxxxxxxx
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3   # ou pro-api.coingecko.com pour Pro
```

La clé est utilisée **uniquement côté serveur** dans `src/app/api/prices/route.ts`.
Le client n'appelle jamais CoinGecko directement.

## Déploiement Vercel

1. **Push le code** sur GitHub (déjà fait sur `claude/optimistic-noether-km32O` du repo `sensitor/shopify`).
2. Sur [vercel.com](https://vercel.com), **Import Project** → choisis le repo `Sensitor/shopify`.
3. **Root Directory** → `stackwise` (important, sinon Vercel cherche un Next.js à la racine).
4. **Environment Variables** → ajoute `COINGECKO_API_KEY` (et optionnellement `COINGECKO_BASE_URL`).
5. **Deploy**. Tu obtiens une URL `stackwise-xxx.vercel.app`.

L'app sera accessible 24/7. Les données restent dans le navigateur où tu te connectes
(un navigateur = un set de données : pas de synchro entre PC et mobile).

## Architecture

```
stackwise/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              → <App />
│   │   ├── globals.css
│   │   └── api/prices/route.ts   → proxy CoinGecko + cache 60s
│   ├── components/
│   │   ├── App.tsx               → état global + orchestration des onglets
│   │   ├── Dashboard.tsx
│   │   ├── Holdings.tsx
│   │   ├── Plan.tsx
│   │   ├── PriceStatusBadge.tsx
│   │   └── ui.tsx
│   └── lib/
│       ├── vca.ts                → moteur pur (computeRecommendation)
│       ├── vca.test.ts           → 12 tests Vitest
│       ├── assets.ts             → registry des cryptos + couleurs
│       ├── format.ts             → fmtEUR, fmtPct, todayISO
│       ├── storage.ts            → useLocalState (hook localStorage)
│       ├── usePrices.ts          → fetch /api/prices + refresh 60s
│       └── stackwise-state.ts    → useStackwise (état app)
├── tailwind.config.ts
├── tsconfig.json (strict + noUncheckedIndexedAccess)
└── vitest.config.ts
```

## Note réglementaire

Stackwise affiche des **calculs de stratégie**, pas un conseil en investissement.
Le disclaimer est présent sur le dashboard et l'onglet Plan.
