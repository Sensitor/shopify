import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .max(500)
    .regex(/^[a-z0-9-]+(,[a-z0-9-]+)*$/i, 'expected comma-separated coingecko ids'),
});

interface CoingeckoResponse {
  [id: string]: { eur?: number };
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: CoingeckoResponse }>();

async function fetchCoingecko(ids: string): Promise<CoingeckoResponse> {
  const cached = cache.get(ids);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const base = process.env.COINGECKO_BASE_URL ?? 'https://api.coingecko.com/api/v3';
  const apiKey = process.env.COINGECKO_API_KEY;
  const url = `${base}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=eur`;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (apiKey) {
    // Demo keys et pro keys utilisent un header différent.
    const isPro = base.includes('pro-api.coingecko.com');
    headers[isPro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key'] = apiKey;
  }

  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`CoinGecko ${res.status}`);
  }
  const data = (await res.json()) as CoingeckoResponse;
  cache.set(ids, { at: Date.now(), data });
  return data;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ ids: url.searchParams.get('ids') });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_query', detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const data = await fetchCoingecko(parsed.data.ids);
    const prices: Record<string, number> = {};
    for (const [id, value] of Object.entries(data)) {
      if (value && typeof value.eur === 'number') prices[id] = value.eur;
    }
    return NextResponse.json(
      { prices, fetchedAt: new Date().toISOString() },
      { headers: { 'cache-control': 'public, max-age=30, s-maxage=60' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: 'upstream_failed', message }, { status: 502 });
  }
}
