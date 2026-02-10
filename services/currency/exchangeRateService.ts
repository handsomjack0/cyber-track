
import { requestJson } from "../../utils/apiClient";

interface ExchangeRates {
  [key: string]: number;
}

const STORAGE_KEY = 'cloudtrack_exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// Default fallback rates (Base: CNY)
// Meaning: 1 Unit of Foreign Currency = X CNY
const DEFAULT_RATES: ExchangeRates = {
  'CNY': 1,
  'USD': 7.25,
  'EUR': 7.85,
  'GBP': 9.20,
  'HKD': 0.93,
  'JPY': 0.048
};

const readLocalRatesCache = (): { timestamp: number; rates: ExchangeRates } | null => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as { timestamp: number; rates: ExchangeRates };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const getExchangeRates = async (): Promise<{ rates: ExchangeRates; source?: string; updatedAt?: string }> => {
  try {
    // 1. Check Local Cache
    const localCache = readLocalRatesCache();
    if (localCache) {
      const { timestamp, rates } = localCache;
      if (Date.now() - timestamp < CACHE_DURATION) {
        return { rates, source: 'cache', updatedAt: new Date(timestamp).toISOString() };
      }
    }

    // 2. Fetch from server cache (preferred)
    const response = await requestJson<{ rates: Record<string, number>; source?: string; updatedAt?: string }>(
      '/api/v1/exchange-rates',
      { timeoutMs: 8000 }
    );

    if (!response.ok || !response.data?.rates) throw new Error('Failed to fetch rates');

    const rates = response.data.rates as ExchangeRates;
    const source = response.data.source;
    const updatedAt = response.data.updatedAt;

    // 3. Save to Cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      rates
    }));

    return { rates, source, updatedAt };

  } catch (error) {
    console.warn('Currency fetch failed, using fallback rates', error);
    return { rates: DEFAULT_RATES, source: 'fallback', updatedAt: new Date().toISOString() };
  }
};

export const setExchangeRateOverride = async (rates: Record<string, number>): Promise<boolean> => {
  const res = await requestJson<{ success?: boolean; error?: string }>(
    '/api/v1/exchange-rates/override',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rates }),
      timeoutMs: 10000
    }
  );
  if (!res.ok) {
    throw new Error(res.data?.error || 'Failed to save override');
  }
  return true;
};

export const clearExchangeRateOverride = async (): Promise<boolean> => {
  const res = await requestJson<{ success?: boolean; error?: string }>(
    '/api/v1/exchange-rates/override',
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 10000
    }
  );
  if (!res.ok) {
    throw new Error(res.data?.error || 'Failed to clear override');
  }
  return true;
};
