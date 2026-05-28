# Stackwise

DCA / VCA crypto tracker — Next.js 14 (App Router) + TypeScript + Tailwind + Supabase.

## État

**Phase 1 — Socle** ✅
- Projet Next.js 14 / TS strict / Tailwind initialisé.
- Schéma Supabase complet (`supabase/schema.sql`) avec RLS sur toutes les tables.
- Moteur VCA pur et testé (`src/lib/vca.ts` + `src/lib/vca.test.ts`).

**Reste à faire (Phase 1 MVP)** : API prix CoinGecko (proxy serveur avec cache 60s), auth Supabase (email + Google), onboarding, dashboard, holdings, réglages.

## Installation

```bash
cd stackwise
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm test                     # lance Vitest sur le moteur VCA
npm run dev                  # http://localhost:3000
```

## Variables d'environnement

Voir `.env.example`. **Aucune clé secrète ne doit être exposée côté client** :
- `NEXT_PUBLIC_*` sont publiques.
- `COINGECKO_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` restent côté serveur uniquement (API routes).

## Supabase

Crée un projet Supabase, puis exécute `supabase/schema.sql` dans l'éditeur SQL. Toutes les tables ont RLS activé — un utilisateur ne peut voir que ses propres données.

## Tests

```bash
npm test           # one-shot
npm run test:watch # mode watch
```

Les tests couvrent : DCA, VCA en retard, VCA en avance, bornes (min 25% / max 250%), normalisation des allocations, somme `perAsset == recommendedTotal`.

## Note réglementaire

Stackwise présente des **calculs de stratégie**, pas un conseil en investissement (statut CIF non détenu). Le disclaimer doit être visible sur chaque écran de recommandation. Valider le statut juridique avec un avocat avant commercialisation.
