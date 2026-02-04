import { Env, jsonResponse } from '../../../utils/storage';

interface RatesPayload {
  rates: Record<string, number>;
  source: 'override' | 'cache' | 'live' | 'fallback';
  updatedAt: string;
}

const CACHE_KEY = 'exchange_rates_cache';
const OVERRIDE_KEY = 'exchange_rates_override';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const DEFAULT_RATES: Record<string, number> = {
  CNY: 1,
  USD: 7.25,
  EUR: 7.85,
  GBP: 9.2,
  HKD: 0.93,
  JPY: 0.048
};

const fetchLiveRates = async () => {
  const res = await fetch('https://api.frankfurter.app/latest?from=CNY');
  if (!res.ok) throw new Error('Failed to fetch rates');
  const data = await res.json() as { rates: Record<string, number> };
  const processed: Record<string, number> = { CNY: 1 };
  Object.entries(data.rates || {}).forEach(([currency, rate]) => {
    processed[currency] = 1 / rate;
  });
  return processed;
};

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;
  const kv = env.CLOUDTRACK_KV;

  try {
    if (kv) {
      const overrideRaw = await kv.get(OVERRIDE_KEY);
      if (overrideRaw) {
        const override = JSON.parse(overrideRaw) as { rates: Record<string, number>; updatedAt: string };
        return jsonResponse({ rates: override.rates, source: 'override', updatedAt: override.updatedAt } as RatesPayload);
      }

      const cachedRaw = await kv.get(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { rates: Record<string, number>; updatedAt: string };
        const age = Date.now() - new Date(cached.updatedAt).getTime();
        if (age < CACHE_DURATION_MS) {
          return jsonResponse({ rates: cached.rates, source: 'cache', updatedAt: cached.updatedAt } as RatesPayload);
        }
      }
    }

    const liveRates = await fetchLiveRates();
    const payload: RatesPayload = {
      rates: liveRates,
      source: 'live',
      updatedAt: new Date().toISOString()
    };

    if (kv) {
      await kv.put(CACHE_KEY, JSON.stringify({ rates: payload.rates, updatedAt: payload.updatedAt }));
    }

    return jsonResponse(payload);
  } catch (error) {
    console.warn('Exchange rate fetch failed, fallback used', error);
    return jsonResponse({
      rates: DEFAULT_RATES,
      source: 'fallback',
      updatedAt: new Date().toISOString()
    } as RatesPayload);
  }
};
