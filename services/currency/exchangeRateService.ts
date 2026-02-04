
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

export const getExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // 1. Check Local Cache
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { timestamp, rates } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rates;
      }
    }

    // 2. Fetch from API (Using a free public API for demo purposes)
    // We fetch base USD and convert to CNY base, or fetch base CNY directly if supported.
    // frankfurter.app is open source and requires no key.
    const response = await requestJson<{ rates: Record<string, number> }>(
      'https://api.frankfurter.app/latest?from=CNY',
      { timeoutMs: 8000 }
    );
    
    if (!response.ok || !response.data?.rates) throw new Error('Failed to fetch rates');
    
    // The API returns: 1 CNY = X USD. 
    // We usually want: 1 USD = X CNY for easier calculation (Cost * Rate).
    // So we invert the rates from the API, or easier: 
    // Let's use the API rates directly to normalize everything to CNY.
    // If API returns { rates: { USD: 0.138 } } means 1 CNY = 0.138 USD.
    // To convert 100 USD to CNY: 100 / 0.138.
    
    // However, to keep our logic simple (Cost * Rate), let's pre-calculate the multiplier.
    // Multiplier = 1 / API_Rate
    
    const processedRates: ExchangeRates = { 'CNY': 1 };
    Object.entries(response.data.rates as Record<string, number>).forEach(([currency, rate]) => {
      processedRates[currency] = 1 / rate;
    });

    // 3. Save to Cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      rates: processedRates
    }));

    return processedRates;

  } catch (error) {
    console.warn('Currency fetch failed, using fallback rates', error);
    return DEFAULT_RATES;
  }
};
