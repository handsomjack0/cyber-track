import { Env, jsonResponse, errorResponse, checkAuth } from '../../../utils/storage';

const OVERRIDE_KEY = 'exchange_rates_override';

const sanitizeRates = (input: any) => {
  const allowed = ['CNY', 'USD', 'EUR', 'GBP', 'HKD', 'JPY'];
  const rates: Record<string, number> = {};
  for (const code of allowed) {
    const value = Number(input?.[code]);
    if (Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }
  return rates;
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  const kv = context.env.CLOUDTRACK_KV;
  if (!kv) return errorResponse('KV not configured', 500);

  try {
    const body = await context.request.json();
    const rates = sanitizeRates(body?.rates || {});
    if (Object.keys(rates).length === 0) {
      return errorResponse('No valid rates provided', 400);
    }

    const payload = {
      rates,
      updatedAt: new Date().toISOString()
    };

    await kv.put(OVERRIDE_KEY, JSON.stringify(payload));
    return jsonResponse({ success: true, ...payload });
  } catch (error) {
    return errorResponse(`Failed to save override: ${String(error)}`, 500);
  }
};

export const onRequestDelete = async (context: { env: Env; request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  const kv = context.env.CLOUDTRACK_KV;
  if (!kv) return errorResponse('KV not configured', 500);

  try {
    if (kv.delete) {
      await kv.delete(OVERRIDE_KEY);
    } else {
      await kv.put(OVERRIDE_KEY, '');
    }
    return jsonResponse({ success: true, cleared: true });
  } catch (error) {
    return errorResponse(`Failed to clear override: ${String(error)}`, 500);
  }
};
