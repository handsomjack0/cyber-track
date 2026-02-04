import { Resource, BillingCycle } from '../../types';

export const SYMBOL_MAP: Record<string, string> = {
  '$': 'USD',
  '¥': 'CNY',
  '€': 'EUR',
  '£': 'GBP'
};

export const convertToCNY = (cost: number, currencySymbol: string, rates: Record<string, number>): number => {
  const currencyCode = SYMBOL_MAP[currencySymbol] || 'CNY';
  const rate = rates[currencyCode] || rates[currencySymbol] || 1;
  return cost * rate;
};

export const calculateYearlyCost = (resource: Resource): number => {
  const { cost, billingCycle } = resource;

  if (!billingCycle) return cost;

  switch (billingCycle) {
    case BillingCycle.MONTHLY:
      return cost * 12;
    case BillingCycle.QUARTERLY:
      return cost * 4;
    case BillingCycle.YEARLY:
      return cost;
    case BillingCycle.ONE_TIME:
      return 0;
    default:
      return cost;
  }
};
