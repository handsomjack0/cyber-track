
import { Resource, BillingCycle } from '../../types';

export const SYMBOL_MAP: Record<string, string> = {
  '$': 'USD',
  '¥': 'CNY',
  '€': 'EUR',
  '£': 'GBP'
};

/**
 * Converts any cost to CNY based on provided rates.
 */
export const convertToCNY = (cost: number, currencySymbol: string, rates: Record<string, number>): number => {
  const currencyCode = SYMBOL_MAP[currencySymbol] || 'CNY';
  // If we don't have the rate, default to 1 (assume CNY) or handle error. 
  // Fallback logic: if code is same as symbol (e.g. user typed code), try that.
  const rate = rates[currencyCode] || rates[currencySymbol] || 1;
  return cost * rate;
};

/**
 * Normalizes cost to a Yearly basis for comparison.
 */
export const calculateYearlyCost = (resource: Resource): number => {
  const { cost, billingCycle } = resource;
  
  if (!billingCycle) return cost; // Default assumption

  switch (billingCycle) {
    case BillingCycle.MONTHLY: return cost * 12;
    case BillingCycle.QUARTERLY: return cost * 4;
    case BillingCycle.YEARLY: return cost;
    case BillingCycle.ONE_TIME: return 0; // One-time costs don't count towards recurring yearly budget
    default: return cost;
  }
};
